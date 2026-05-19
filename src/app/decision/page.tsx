'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  YINZI_PROMPT, 
  WUSHI_PROMPT, 
  LIZHI_PROMPT, 
  YUWANG_PROMPT, 
  LEZI_PROMPT, 
  DUOXIANG_PROMPT 
} from '@/lib/prompts';

// 角色名称映射
const ROLE_NAMES: Record<string, string> = {
  yinzi: '引子入',
  wushi: '务实肋骨',
  lizhi: '理智翅根',
  yuwang: '欲望鸡排',
  lezi: '乐子入',
  duoxiang: '多想鸭舌',
};

// 角色颜色映射 - 仅用于区分名称颜色
const ROLE_COLORS: Record<string, string> = {
  yinzi: 'text-yellow-400',
  wushi: 'text-red-400',
  lizhi: 'text-blue-400',
  yuwang: 'text-pink-400',
  lezi: 'text-purple-400',
  duoxiang: 'text-teal-400',
};

// 角色提示词映射
const ROLE_PROMPTS: Record<string, string> = {
  wushi: WUSHI_PROMPT,
  lizhi: LIZHI_PROMPT,
  yuwang: YUWANG_PROMPT,
};

type Message = {
  role: string;
  content: string;
  isStreaming?: boolean;
  tags?: string[];
};

type Assignment = {
  wushi: string;
  lizhi: string;
  yuwang: string;
};

// 创建一个包装组件来处理 useSearchParams
function DecisionContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 会议状态 - 始终从 input 开始，避免服务端渲染冲突
  const [phase, setPhase] = useState<'input' | 'intro' | 'speaking' | 'interrupt' | 'lezi' | 'final' | 'saved'>('input');
  const [hasStartedFromUrl, setHasStartedFromUrl] = useState(false);
  const [urlQuestion, setUrlQuestion] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [speakersCompleted, setSpeakersCompleted] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [emotionDescription, setEmotionDescription] = useState<string>('');
  const [userQuestion, setUserQuestion] = useState('');
  const [assignments, setAssignments] = useState<Assignment | null>(null);
  const [finalAdvice, setFinalAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 检查用户登录状态 - 只有在 loading 完成后才检查
  useEffect(() => {
    if (loading) return; // 等待 AuthContext 初始化完成
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 从localStorage获取问题并自动开始会议
  useEffect(() => {
    // 使用 localStorage 获取问题
    const question = localStorage.getItem('decisionQuestion');
    
    if (question) {
      setUrlQuestion(question);
      // 获取后立即清除，避免重复使用
      localStorage.removeItem('decisionQuestion');
    }
  }, []);
  
  // 如果URL中有问题参数，自动填充并开始会议
  useEffect(() => {
    console.log('自动开始会议检查:', { loading, user: !!user, urlQuestion, isLoading, hasStartedFromUrl });
    
    // 等待用户认证完成和组件加载完成
    if (loading || !user) {
      console.log('等待认证完成:', { loading, user: !!user });
      return;
    }
    
    if (urlQuestion && !isLoading && !hasStartedFromUrl) {
      console.log('满足条件，开始自动启动会议');
      // 设置标志位防止重复触发
      setHasStartedFromUrl(true);
      // 设置问题并立即开始会议
      const question = decodeURIComponent(urlQuestion);
      // 先设置问题
      setUserQuestion(question);
      // 先切换到 intro 阶段显示加载状态
      setPhase('intro');
      // 使用 setTimeout 确保状态更新完成后再开始
      setTimeout(() => {
        startMeetingWithQuestion(question);
      }, 300);
    }
  }, [urlQuestion, isLoading, hasStartedFromUrl, loading, user]);

  // 流式调用DeepSeek API（用于非JSON格式输出，如引子入总结）
  const streamChat = async (
    systemPrompt: string,
    userMessages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...userMessages.map(m => ({ role: 'user', content: m.content }))
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('API调用失败');
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value);
        // 解析SSE格式
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0].delta.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    }
  };

  // 流式调用DeepSeek API（用于角色发言，解析JSON并只输出response字段）
  const streamChatWithJson = async (
    systemPrompt: string,
    userContent: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('API调用失败');
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let done = false;
    let fullContent = '';
    let inResponse = false;
    let responseBuffer = '';
    let tempBuffer = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0].delta.content;
              if (content) {
                // 直接累积原始内容
                tempBuffer += content;
                
                // 检查是否已经进入response字段的值部分
                if (!inResponse) {
                  // 查找response字段的开始
                  const responseFieldIndex = tempBuffer.indexOf('"response"');
                  if (responseFieldIndex !== -1) {
                    // 找到response字段后，查找冒号和引号
                    const colonIndex = tempBuffer.indexOf(':', responseFieldIndex);
                    if (colonIndex !== -1) {
                      const afterColon = tempBuffer.slice(colonIndex + 1).trim();
                      if (afterColon.startsWith('"')) {
                        // 已经进入response值的引号内
                        inResponse = true;
                        // 跳过引号，从实际内容开始
                        const contentStart = colonIndex + 1 + afterColon.indexOf('"') + 1;
                        responseBuffer = tempBuffer.slice(contentStart);
                        // 处理转义字符
                        responseBuffer = responseBuffer.replace(/\\("|\\)/g, '$1');
                        onChunk(responseBuffer);
                        tempBuffer = '';
                      }
                    }
                  }
                } else {
                  // 已经在response字段内，直接处理内容
                  let currentContent = content;
                  // 检查是否遇到结束引号（非转义的）
                  const endQuoteIndex = currentContent.search(/(?<!\\)"/);
                  if (endQuoteIndex !== -1) {
                    // 遇到结束引号，只取引号前的内容
                    currentContent = currentContent.slice(0, endQuoteIndex);
                    inResponse = false;
                  }
                  // 处理转义字符
                  currentContent = currentContent.replace(/\\("|\\)/g, '$1');
                  onChunk(currentContent);
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    }
  };

  // 非流式调用（用于获取JSON数据）
  const fetchJson = async (systemPrompt: string, userContent: string): Promise<any> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'API调用失败');
    }

    const data = await response.json();
    
    if (!data.content) {
      throw new Error('API返回内容为空');
    }

    try {
      return JSON.parse(data.content);
    } catch (parseError) {
      console.error('JSON解析失败，尝试从内容中提取JSON:', data.content);
      
      // 尝试从可能被包裹的内容中提取JSON
      const jsonMatch = data.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.response !== undefined) {
            return parsed;
          }
        } catch (e) {
          console.error('提取的JSON也无法解析:', e);
        }
      }
      
      // 如果所有尝试都失败，尝试清理内容并返回
      const cleanContent = data.content.replace(/[\{\}"\\]/g, '').trim();
      return {
        response: cleanContent || data.content,
        options: ['好的，我了解你的观点了，下一位']
      };
    }
  };

  // 生成情绪标签和多想鸭舌发言
  const generateEmotion = async () => {
    try {
      const lastMessages = messages.slice(-5).map(m => `${ROLE_NAMES[m.role]}: ${m.content}`).join('\n');
      const emotion = await fetchJson(DUOXIANG_PROMPT, lastMessages);
      const tags = emotion.tags || [];
      setEmotionTags(tags);
      
      // 将情绪标签附加到最后一条发言者（务实/理智/欲望）消息上
      setMessages(prev => {
        const newMessages = [...prev];
        // 从后往前找最后一条发言者消息
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (['wushi', 'lizhi', 'yuwang'].includes(newMessages[i].role)) {
            newMessages[i].tags = tags;
            break;
          }
        }
        return newMessages;
      });
      
      // 20%概率让多想鸭舌发言（作为对话消息）
      if (Math.random() < 0.20 && emotion.description) {
        setMessages(prev => [...prev, { 
          role: 'duoxiang', 
          content: emotion.description
        }]);
        setEmotionDescription('');
      } else {
        setEmotionDescription('');
      }
    } catch (error) {
      console.error('生成情绪标签失败:', error);
    }
  };

  // 触发乐子入（使用流式输出）
  const triggerLezi = async (): Promise<boolean> => {
    if (Math.random() > 0.40) return false;
    if (messages.length === 0) return false;
    
    setPhase('lezi');
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      setPhase('speaking');
      return false;
    }
    
    try {
      // 添加乐子入发言（流式）- 使用streamChatWithJson来正确解析JSON
      setMessages(prev => [...prev, { role: 'lezi', content: '', isStreaming: true }]);
      let fullLeziContent = '';
      
      await streamChatWithJson(LEZI_PROMPT, lastMessage.content, (chunk) => {
        fullLeziContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'lezi' && lastMsg.isStreaming) {
            lastMsg.content = fullLeziContent;
          }
          return newMessages;
        });
      });
      
      // 结束流式输出
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === 'lezi' && lastMsg.isStreaming) {
          lastMsg.isStreaming = false;
        }
        return newMessages;
      });
      
      await generateEmotion();
      
      // 当前发言者回应乐子入（使用流式）- 使用streamChatWithJson来正确解析JSON
      if (currentSpeaker && ROLE_PROMPTS[currentSpeaker]) {
        setMessages(prev => [...prev, { role: currentSpeaker, content: '', isStreaming: true }]);
        let fullResponse = '';
        
        await streamChatWithJson(ROLE_PROMPTS[currentSpeaker], 
          `乐子入说："${fullLeziContent}"，请你用激烈的言辞回应他的调侃。`, (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === currentSpeaker && lastMsg.isStreaming) {
              lastMsg.content = fullResponse;
            }
            return newMessages;
          });
        });
        
        // 结束流式输出
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === currentSpeaker && lastMsg.isStreaming) {
            lastMsg.isStreaming = false;
          }
          return newMessages;
        });
      }
      
      setPhase('speaking');
      return true;
    } catch (error) {
      console.error('触发乐子入失败:', error);
      setPhase('speaking');
      return false;
    }
  };

  // 触发插嘴（使用流式输出）
  const triggerInterrupt = async (userChoice: string): Promise<boolean> => {
    if (!currentSpeaker) return false;
    
    // 获取插嘴者 - 允许已完成发言的角色也可以插嘴反驳
    const allSpeakers = ['wushi', 'lizhi', 'yuwang'];
    const otherSpeakers = allSpeakers.filter(s => s !== currentSpeaker);
    if (otherSpeakers.length === 0) return false;
    
    // 关键词映射：检测用户选项触发的角色对立
    const oppositionKeywords: Record<string, string[]> = {
      wushi: ['现实', '实际', '成本', '风险', '可行', '实用', '生存', '物质'],
      lizhi: ['逻辑', '理性', '分析', '道理', '长远', '合理', '推理'],
      yuwang: ['快乐', '享受', '想要', '情感', '感受', '满足', '欲望', '刺激'],
    };
    
    // 检测用户选项是否触及相关角色的对立话题
    let shouldInterrupt = Math.random() < 0.90; // 提高基础概率到90%，让每个环节都更可能有辩驳
    let triggeredSpeakers: string[] = [];
    
    // 检查关键词 - 如果涉及对立话题，增加触发概率并记录相关角色
    for (const [role, keywords] of Object.entries(oppositionKeywords)) {
      if (role !== currentSpeaker && keywords.some(k => userChoice.includes(k))) {
        shouldInterrupt = true;
        triggeredSpeakers.push(role);
      }
    }
    
    if (!shouldInterrupt) return false;
    
    // 选择插嘴者：
    // 1. 如果有关键词触发的角色，优先从这些角色中随机选择
    // 2. 否则从所有其他角色中完全随机选择
    let interruptSpeaker: string;
    if (triggeredSpeakers.length > 0) {
      // 从被关键词触发的角色中随机选择
      interruptSpeaker = triggeredSpeakers[Math.floor(Math.random() * triggeredSpeakers.length)];
    } else {
      // 完全随机选择其他角色，确保每个角色都有平等的机会
      interruptSpeaker = otherSpeakers[Math.floor(Math.random() * otherSpeakers.length)];
    }
    setPhase('interrupt');
    
    try {
      
      // 插嘴者发言（使用fetchJson获取，只显示response）
      const interruptResult = await fetchJson(ROLE_PROMPTS[interruptSpeaker],
        `用户说："${userChoice}"，你强烈不同意${ROLE_NAMES[currentSpeaker]}的观点，请激烈地插嘴反驳！`);
      
      const interruptContent = interruptResult.response || '';
      setMessages(prev => [...prev, { role: interruptSpeaker, content: '', isStreaming: true }]);
      
      let displayedInterrupt = '';
      const interruptChars = interruptContent.split('');
      let interruptIndex = 0;
      
      await new Promise<void>((resolve) => {
        const typeInterval = setInterval(() => {
          if (interruptIndex < interruptChars.length) {
            displayedInterrupt += interruptChars[interruptIndex];
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === interruptSpeaker && lastMsg.isStreaming) {
                lastMsg.content = displayedInterrupt;
              }
              return newMessages;
            });
            interruptIndex++;
          } else {
            clearInterval(typeInterval);
            // 结束流式输出
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === interruptSpeaker && lastMsg.isStreaming) {
                lastMsg.isStreaming = false;
              }
              return newMessages;
            });
            resolve();
          }
        }, 30);
      });
      
      await generateEmotion();
      await triggerLezi();
      
      // 当前发言者回应插嘴
      const responseResult = await fetchJson(ROLE_PROMPTS[currentSpeaker],
        `${ROLE_NAMES[interruptSpeaker]}插嘴说："${interruptContent}"，请你用激烈的言辞反驳他，然后继续回应用户的问题："${userChoice}"`);
      
      const responseContent = responseResult.response || '';
      setMessages(prev => [...prev, { role: currentSpeaker, content: '', isStreaming: true }]);
      
      let displayedResponse = '';
      const responseChars = responseContent.split('');
      let responseIndex = 0;
      
      await new Promise<void>((resolve) => {
        const typeInterval = setInterval(() => {
          if (responseIndex < responseChars.length) {
            displayedResponse += responseChars[responseIndex];
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === currentSpeaker && lastMsg.isStreaming) {
                lastMsg.content = displayedResponse;
              }
              return newMessages;
            });
            responseIndex++;
          } else {
            clearInterval(typeInterval);
            // 结束流式输出
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === currentSpeaker && lastMsg.isStreaming) {
                lastMsg.isStreaming = false;
              }
              return newMessages;
            });
            resolve();
          }
        }, 30);
      });
      
      // 获取选项
      setOptions([...(responseResult.options || []), '好的，我了解你的观点了，下一位']);
      await generateEmotion();
      
      setPhase('speaking');
      return true;
    } catch (error) {
      console.error('触发插嘴失败:', error);
      setPhase('speaking');
      return false;
    }
  };

  // 开始会议
  const startMeeting = async () => {
    console.log('startMeeting called, userQuestion:', userQuestion);
    if (!userQuestion.trim()) {
      console.log('userQuestion is empty');
      return;
    }
    console.log('calling startMeetingWithQuestion');
    await startMeetingWithQuestion(userQuestion);
  };
  
  const startMeetingWithQuestion = async (question: string) => {
    if (!question.trim()) return;
    
    console.log('startMeetingWithQuestion called with:', question);
    
    setIsLoading(true);
    setPhase('intro');
    setMessages([]);
    setSpeakersCompleted([]);
    
    try {
      // 引子入入场，拆解问题
      const introResult = await fetchJson(YINZI_PROMPT, question);
      console.log('引子入结果:', introResult);
      setMessages([{ role: 'yinzi', content: introResult.summary }]);
      setAssignments(introResult.assignments);
      await generateEmotion();
      
      // 开始第一位发言者
      await startSpeaker('wushi', introResult.assignments.wushi);
    } catch (error) {
      console.error('开始会议失败:', error);
      alert('会议启动失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始某位发言者
  const startSpeaker = async (speaker: string, question: string) => {
    setCurrentSpeaker(speaker);
    setPhase('speaking');
    
    // 主持人宣布入场
    setMessages(prev => [...prev, { 
      role: 'yinzi', 
      content: `有请${ROLE_NAMES[speaker]}发言。` 
    }]);
    
    // 发言者发表观点（使用非流式获取JSON）
    const result = await fetchJson(ROLE_PROMPTS[speaker], question);
    
    // 只显示response部分，流式输出
    const responseContent = result.response || '';
    setMessages(prev => [...prev, { role: speaker, content: '', isStreaming: true }]);
    
    let displayedContent = '';
    const chars = responseContent.split('');
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < chars.length) {
        displayedContent += chars[index];
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === speaker && lastMessage.isStreaming) {
            lastMessage.content = displayedContent;
          }
          return newMessages;
        });
        index++;
      } else {
        clearInterval(typeInterval);
        // 结束流式输出
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === speaker && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
          }
          return newMessages;
        });
        
        // 获取选项
        setOptions([...(result.options || []), '好的，我了解你的观点了，下一位']);
        
        // 触发情绪分析和乐子入
        setTimeout(async () => {
          await generateEmotion();
          await triggerLezi();
        }, 100);
      }
    }, 30); // 打字速度
  };

  // 处理用户选择
  const handleOptionClick = async (option: string) => {
    setIsLoading(true);
    setOptions([]);
    
    // 添加用户选择到消息
    setMessages(prev => [...prev, { role: 'user', content: option }]);
    
    try {
      // 如果选择结束发言
      if (option === '好的，我了解你的观点了，下一位') {
        if (currentSpeaker) {
          setSpeakersCompleted(prev => [...prev, currentSpeaker]);
          
          // 主持人宣布结束
          setMessages(prev => [...prev, { 
            role: 'yinzi', 
            content: `感谢${ROLE_NAMES[currentSpeaker]}的发言。` 
          }]);
          
          // 检查是否所有发言者都已发言
          if (speakersCompleted.length + 1 === 3) {
            await endMeeting();
          } else {
            // 开始下一位发言者
            const nextSpeaker = ['wushi', 'lizhi', 'yuwang'].find(
              s => s !== currentSpeaker && !speakersCompleted.includes(s)
            )!;
            await startSpeaker(nextSpeaker, assignments![nextSpeaker as keyof Assignment]);
          }
        }
      } else {
        // 先尝试触发插嘴
        const interrupted = await triggerInterrupt(option);
        
        // 如果没有触发插嘴，直接回应用户（使用fetchJson获取，只显示response）
        if (!interrupted && currentSpeaker) {
          const responseResult = await fetchJson(ROLE_PROMPTS[currentSpeaker], option);
          const responseContent = responseResult.response || '';
          
          setMessages(prev => [...prev, { role: currentSpeaker, content: '', isStreaming: true }]);
          
          let displayedContent = '';
          const chars = responseContent.split('');
          let index = 0;
          
          await new Promise<void>((resolve) => {
            const typeInterval = setInterval(() => {
              if (index < chars.length) {
                displayedContent += chars[index];
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.role === currentSpeaker && lastMsg.isStreaming) {
                    lastMsg.content = displayedContent;
                  }
                  return newMessages;
                });
                index++;
              } else {
                clearInterval(typeInterval);
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.role === currentSpeaker && lastMsg.isStreaming) {
                    lastMsg.isStreaming = false;
                  }
                  return newMessages;
                });
                resolve();
              }
            }, 30);
          });
          
          // 获取选项
          setOptions([...(responseResult.options || []), '好的，我了解你的观点了，下一位']);
          
          await generateEmotion();
          await triggerLezi();
        }
      }
    } catch (error) {
      console.error('处理选择失败:', error);
      alert('处理失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 结束会议
  const endMeeting = async () => {
    setPhase('final');
    setCurrentSpeaker(null);
    
    // 主持人宣布开始总结
    setMessages(prev => [...prev, { 
      role: 'yinzi', 
      content: '所有与会者都已发言完毕。现在我将整合大家的观点，给出最终建议。' 
    }]);
    
    // 使用fetchJson获取总结
    const allMessages = messages.map(m => `${ROLE_NAMES[m.role]}: ${m.content}`).join('\n');
    const finalPrompt = `请整合以下所有观点，总结务实肋骨的现实考量、理智翅根的逻辑分析、欲望鸡排的情感诉求，指出各方观点的冲突点和共识点，最后给出一份平衡、客观、有说服力的最终建议：\n${allMessages}`;
    
    try {
      const result = await fetchJson(YINZI_PROMPT, finalPrompt);
      const summaryContent = result.summary || result.response || '';
      
      // 添加流式总结消息
      setMessages(prev => [...prev, { role: 'yinzi', content: '', isStreaming: true }]);
      let displayedSummary = '';
      const chars = summaryContent.split('');
      let index = 0;
      
      await new Promise<void>((resolve) => {
        const typeInterval = setInterval(() => {
          if (index < chars.length) {
            displayedSummary += chars[index];
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'yinzi' && lastMessage.isStreaming) {
                lastMessage.content = displayedSummary;
              }
              return newMessages;
            });
            index++;
          } else {
            clearInterval(typeInterval);
            // 结束流式输出
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'yinzi' && lastMessage.isStreaming) {
                lastMessage.isStreaming = false;
              }
              return newMessages;
            });
            resolve();
          }
        }, 30);
      });
      
      setFinalAdvice(summaryContent);
    } catch (error) {
      console.error('生成总结失败:', error);
      setFinalAdvice('生成总结时出现错误，请稍后重试。');
    }
    
    await generateEmotion();
  };

  // 保存决策记录
  const saveDecision = async () => {
    setIsLoading(true);
    
    try {
      if (!user) throw new Error('用户未登录');
      
      const decisionData = {
        user_id: user.id,
        title: userQuestion.slice(0, 50),
        messages: JSON.stringify(messages),
        final_advice: finalAdvice,
        emotion_tags: emotionTags,
        initial_question: userQuestion, // 添加初始问题字段
      };
      
      const { error } = await supabase.from('decisions').insert(decisionData);
      
      if (error) throw error;
      
      setPhase('saved');
      alert('决策记录已保存！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始新决策
  const startNewDecision = () => {
    setPhase('input');
    setUserQuestion('');
    setMessages([]);
    setOptions([]);
    setEmotionTags([]);
    setEmotionDescription('');
    setFinalAdvice('');
    setSpeakersCompleted([]);
    setCurrentSpeaker(null);
    setAssignments(null);
  };

  return (
    <div className="min-h-screen text-gray-100 relative">
      {/* 全屏半透明背景覆盖层 */}
      <div className="fixed inset-0 bg-black/50 pointer-events-none" />
      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold mb-8 text-center">思想内阁</h1>
        
        {/* 输入阶段 */}
        {phase === 'input' && (
          <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">有什么问题困扰着你？</h2>
            <textarea
              className="w-full h-32 bg-black/40 rounded-lg p-4 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
              placeholder="输入你的问题或困惑，让思想内阁帮你做出决策..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              disabled={isLoading}
            />
            <button
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              onClick={startMeeting}
              disabled={isLoading || !userQuestion.trim()}
            >
              {isLoading ? '正在启动会议...' : '开始决策'}
            </button>
          </div>
        )}
        
        {/* 准备阶段 - 显示加载状态 */}
        {phase === 'intro' && messages.length === 0 && (
          <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/10 text-center">
            <div className="text-4xl mb-4">🔮</div>
            <h2 className="text-xl font-semibold mb-2">正在组建思想内阁...</h2>
            <p className="text-gray-400">请稍候，各个人格正在就位...</p>
          </div>
        )}
        
        {/* 会议阶段 */}
        {(phase !== 'input' && phase !== 'saved') && (
          <div className="space-y-6">
            {/* 消息列表 */}
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`w-full max-w-[80%] rounded-lg p-4 transition-none ${
                      message.role === 'user' 
                        ? 'bg-black/50 border border-white/10' 
                        : 'bg-black/50 border border-white/10'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <div className={`font-semibold mb-2 text-sm ${ROLE_COLORS[message.role] || 'text-gray-400'}`}>
                        {ROLE_NAMES[message.role]}
                        {['wushi', 'lizhi', 'yuwang'].includes(message.role) && message.tags && message.tags.length > 0 && (
                          <span className="ml-2">
                            {message.tags.map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="ml-1 px-1.5 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-gray-200">
                      {message.content}
                      {message.isStreaming && <span className="animate-pulse">▌</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* 情绪标签 */}
            {emotionTags.length > 0 && (
              <div className="bg-black/50 backdrop-blur-md rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-400">多想鸭舌：</span>
                  <div className="flex gap-2">
                    {emotionTags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-black/40 border border-white/10 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-400 italic">{emotionDescription}</p>
              </div>
            )}
            
            {/* 选项 */}
            {options && options.length > 0 && !isLoading && (
              <div className="space-y-2">
                {options.map((option, index) => (
                  <button
                    key={index}
                    className="w-full text-left bg-black/50 hover:bg-black/70 border border-white/10 hover:border-white/20 rounded-lg p-4 transition-colors"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            
            {/* 最终阶段按钮 */}
            {phase === 'final' && !isLoading && (
              <div className="flex gap-4">
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  onClick={saveDecision}
                >
                  保存决策记录
                </button>
                <button
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  onClick={startNewDecision}
                >
                  开始新决策
                </button>
              </div>
            )}
            
            {/* 加载状态 */}
            {isLoading && (
              <div className="text-center text-gray-400 py-4">
                正在思考中...
              </div>
            )}
          </div>
        )}
        
        {/* 保存成功阶段 */}
        {phase === 'saved' && (
          <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/10 text-center">
            <h2 className="text-xl font-semibold mb-4 text-green-400">决策记录已保存！</h2>
            <p className="text-gray-400 mb-6">你可以在历史记录页面查看所有决策。</p>
            <div className="flex gap-4">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                onClick={() => router.push('/history')}
              >
                查看历史记录
              </button>
              <button
                className="flex-1 bg-black/50 border border-white/10 hover:bg-black/70 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                onClick={startNewDecision}
              >
                开始新决策
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 主组件，用 Suspense 包装
export default function DecisionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">加载中...</div>
    </div>}>
      <DecisionContent />
    </Suspense>
  );
}