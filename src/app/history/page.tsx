'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface HistoryEntry {
  id: string
  question: string
  thoughts: {
    id: string
    name: string
    type: string
    description: string
    support: number
  }[]
  winner: string
  date: string
  emotionTags?: string[]
  emotionDescription?: string
  dialogHistory?: {
    speaker: string
    role: string
    content: string
  }[]
}

interface DatabaseEntry {
  id: string
  user_id: string
  title: string
  messages: string
  final_advice: string
  emotion_tags: string
}

const typeLabels: Record<string, string> = {
  rational: '理性',
  emotional: '感性',
  radical: '激进',
  conservative: '保守',
  creative: '创意',
  logical: '逻辑',
}

const emotionColors: Record<string, string> = {
  '纠结': 'bg-purple-500/20 text-purple-400',
  '焦虑': 'bg-red-500/20 text-red-400',
  '兴奋': 'bg-yellow-500/20 text-yellow-400',
  '释然': 'bg-green-500/20 text-green-400',
  '愤怒': 'bg-orange-500/20 text-orange-400',
  '期待': 'bg-blue-500/20 text-blue-400',
  '沉思': 'bg-gray-500/20 text-gray-400',
  '矛盾': 'bg-pink-500/20 text-pink-400',
  '平静': 'bg-cyan-500/20 text-cyan-400',
  '迷茫': 'bg-indigo-500/20 text-indigo-400',
}

const ROLE_NAMES: Record<string, string> = {
  yinzi: '引子入',
  wushi: '务实肋骨',
  lizhi: '理智翅根',
  yuwang: '欲望鸡排',
  lezi: '乐子入',
  duoxiang: '多想鸭舌',
  user: '用户',
}

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const loadHistory = async () => {
      // 先尝试从 Supabase 加载
      try {
        const { data, error } = await supabase
          .from('decisions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (!error && data && data.length > 0) {
          const converted = data.map((item: DatabaseEntry) => ({
            id: item.id,
            question: item.title,
            thoughts: [],
            winner: '未知',
            date: item.id, // 使用 id 作为临时日期
            emotionTags: Array.isArray(item.emotion_tags) ? item.emotion_tags : [],
            emotionDescription: '',
            dialogHistory: item.messages ? JSON.parse(item.messages).map((msg: any) => ({
              speaker: ROLE_NAMES[msg.role] || msg.role,
              role: msg.role,
              content: msg.content,
            })) : [],
          }))
          setHistory(converted)
          return
        }
      } catch (err) {
        console.error('Failed to load from Supabase:', err)
      }

      // 回退到 localStorage
      const stored = localStorage.getItem('cabinet_history')
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[]
        parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setHistory(parsed)
      }
    }

    loadHistory()
  }, [user, router])

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`
    } else if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)} 天前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const handleDelete = async (id: string) => {
    // 尝试从 Supabase 删除
    try {
      await supabase.from('decisions').delete().eq('id', id)
    } catch (err) {
      console.error('Failed to delete from Supabase:', err)
    }

    const updated = history.filter(entry => entry.id !== id)
    setHistory(updated)
    localStorage.setItem('cabinet_history', JSON.stringify(updated))
    if (selectedEntry?.id === id) {
      setSelectedEntry(null)
      setShowDetailModal(false)
    }
  }

  const handleViewDetail = (entry: HistoryEntry) => {
    setSelectedEntry(entry)
    setShowDetailModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedEntry(null)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-typewriter text-2xl sm:text-3xl text-cabinet-accent mb-2">
            思想内阁 · 历史
          </h1>
          <p className="font-mono text-sm text-cabinet-text-secondary">
            记录你的每一次内心辩论
          </p>
          <div className="h-px w-24 mx-auto mt-4 bg-gradient-to-r from-transparent via-cabinet-accent to-transparent" />
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center bg-cabinet-card/30 rounded-lg border border-dashed border-cabinet-text-secondary/20">
            <div className="text-4xl mb-4">📜</div>
            <h2 className="font-typewriter text-lg text-cabinet-text mb-2">
              暂无历史记录
            </h2>
            <p className="font-mono text-sm text-cabinet-text-secondary mb-6">
              你的思想辩论历史将会显示在这里
            </p>
            <button
              onClick={() => router.push('/decision')}
              className="px-6 py-2 font-mono text-sm bg-cabinet-accent text-cabinet-bg rounded hover:bg-cabinet-accent/90 transition-colors btn-press"
            >
              开始决策
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-cabinet-card/50 rounded-lg border border-cabinet-text-secondary/20 hover:border-cabinet-text-secondary/40 transition-all animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-typewriter text-sm text-cabinet-text line-clamp-2 flex-1">
                    {entry.question || '无标题决策'}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(entry)}
                      className="px-2 py-1 font-mono text-xs text-cabinet-accent hover:bg-cabinet-accent/10 rounded transition-colors"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-2 py-1 font-mono text-xs text-cabinet-warn hover:bg-cabinet-warn/10 rounded transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs text-cabinet-text-secondary">
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-cabinet-text-secondary/50">·</span>
                  <span className="px-2 py-0.5 bg-cabinet-accent/20 text-cabinet-accent font-mono text-xs rounded">
                    {entry.winner}
                  </span>
                </div>

                {entry.emotionTags && entry.emotionTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.emotionTags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 font-mono text-xs rounded ${emotionColors[tag] || 'bg-gray-500/20 text-gray-400'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {entry.emotionDescription && (
                  <p className="mt-2 font-mono text-xs text-cabinet-text-secondary italic">
                    "{entry.emotionDescription}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-cabinet-card border border-cabinet-text-secondary/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-cabinet-text-secondary/20 flex items-center justify-between">
              <h2 className="font-typewriter text-lg text-cabinet-accent">
                决策详情
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-cabinet-text-secondary hover:text-cabinet-text transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="mb-4">
                <h3 className="font-typewriter text-base text-cabinet-text mb-2">
                  {selectedEntry.question}
                </h3>
                <div className="flex items-center gap-3 font-mono text-xs text-cabinet-text-secondary">
                  <span>{formatDate(selectedEntry.date)}</span>
                  <span className="px-2 py-0.5 bg-cabinet-accent/20 text-cabinet-accent rounded">
                    胜出: {selectedEntry.winner}
                  </span>
                </div>
              </div>

              {selectedEntry.emotionTags && selectedEntry.emotionTags.length > 0 && (
                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedEntry.emotionTags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 font-mono text-xs rounded ${emotionColors[tag] || 'bg-gray-500/20 text-gray-400'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {selectedEntry.emotionDescription && (
                    <p className="font-mono text-xs text-purple-300 italic">
                      {selectedEntry.emotionDescription}
                    </p>
                  )}
                </div>
              )}

              {selectedEntry.dialogHistory && selectedEntry.dialogHistory.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-mono text-xs text-cabinet-text-secondary mb-3">辩论记录</h4>
                  <div className="space-y-3">
                    {selectedEntry.dialogHistory.map((dialog, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="font-mono text-xs text-cabinet-accent shrink-0">
                          {dialog.speaker}
                        </span>
                        <p className="font-mono text-xs text-cabinet-text-secondary">
                          {dialog.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.thoughts.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs text-cabinet-text-secondary mb-3">参与思想</h4>
                  <div className="space-y-2">
                    {selectedEntry.thoughts.map((thought) => (
                      <div
                        key={thought.id}
                        className={`p-3 rounded-lg ${
                          thought.name === selectedEntry.winner
                            ? 'bg-cabinet-accent/10 border border-cabinet-accent/30'
                            : 'bg-cabinet-bg/50 border border-cabinet-text-secondary/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-xs font-mono rounded ${
                              thought.type === 'rational' ? 'bg-blue-500/10 text-blue-400' :
                              thought.type === 'emotional' ? 'bg-pink-500/10 text-pink-400' :
                              thought.type === 'radical' ? 'bg-red-500/10 text-red-400' :
                              thought.type === 'conservative' ? 'bg-amber-500/10 text-amber-400' :
                              thought.type === 'creative' ? 'bg-purple-500/10 text-purple-400' :
                              'bg-cyan-500/10 text-cyan-400'
                            }`}>
                              {typeLabels[thought.type] || thought.type}
                            </span>
                            <span className={`font-typewriter text-sm ${
                              thought.name === selectedEntry.winner
                                ? 'text-cabinet-accent'
                                : 'text-cabinet-text'
                            }`}>
                              {thought.name}
                            </span>
                          </div>
                          <span className={`font-mono text-xs ${
                            thought.name === selectedEntry.winner
                              ? 'text-cabinet-accent'
                              : 'text-cabinet-text-secondary'
                          }`}>
                            {thought.support}%
                          </span>
                        </div>
                        <p className="font-mono text-xs text-cabinet-text-secondary">
                          {thought.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
