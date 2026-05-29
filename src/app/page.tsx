'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const typewriterText = "在Ribs Disco中，每一个声音都值得被倾听。"

const sampleThoughts = [
  {
    id: '1',
    name: '宿命论者的声音',
    type: 'conservative' as const,
    description: '一切都已经注定，我们只是在完成早已写好的剧本。接受命运是最明智的选择。',
    support: 34,
  },
  {
    id: '2',
    name: '存在主义者的呐喊',
    type: 'radical' as const,
    description: '存在先于本质。我们必须自己创造意义，而不是等待某个更高的声音来告诉我们。',
    support: 42,
  },
  {
    id: '3',
    name: '理性之眼',
    type: 'rational' as const,
    description: '让我们冷静分析每一种可能性，用逻辑来驾驭这场思想的辩论。',
    support: 24,
  },
]

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [displayText, setDisplayText] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [userQuestion, setUserQuestion] = useState('')

  const validateQuestion = (question: string): boolean => {
    const cleaned = question.trim().replace(/\s+/g, ' ')
    return cleaned.length >= 3 && !cleaned.match(/^[？?！!。.，,、\s]+$/)
  }

  const startDecision = () => {
    if (!userQuestion.trim()) return

    if (validateQuestion(userQuestion)) {
      localStorage.setItem('decisionQuestion', userQuestion.trim().replace(/\s+/g, ' '))
      router.push('/decision')
    } else {
      alert('请输入有效的问题（至少3个字符，不能只有标点符号）')
    }
  }

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < typewriterText.length) {
        setDisplayText(typewriterText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setTimeout(() => setShowContent(true), 500)
      }
    }, 60)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-typewriter text-5xl sm:text-7xl lg:text-8xl mb-4 title-gradient">
            Ribs Disco
          </h1>
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-cabinet-accent to-transparent mb-8" />

          <div className="font-mono text-lg sm:text-xl text-cabinet-text-secondary min-h-[2em]">
            {displayText}
            <span className="inline-block w-0.5 h-5 bg-cabinet-accent animate-pulse ml-1" />
          </div>

          {showContent && (
            <div className="mt-12 space-y-6 animate-fade-in">
              {!user && (
                <div className="p-6 bg-cabinet-card/50 rounded-lg border border-cabinet-text-secondary/20 max-w-md mx-auto">
                  <p className="font-mono text-sm text-cabinet-text-secondary mb-4">
                    登录后开始你的思想辩论之旅
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link
                      href="/login"
                      className="px-6 py-2 font-mono text-sm bg-cabinet-accent/20 text-cabinet-accent rounded hover:bg-cabinet-accent/30 transition-colors btn-press"
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="px-6 py-2 font-mono text-sm bg-cabinet-accent text-cabinet-bg rounded hover:bg-cabinet-accent/90 transition-colors btn-press"
                    >
                      注册
                    </Link>
                  </div>
                </div>
              )}

              {user && (
                <div className="p-6 bg-black/50 rounded-lg border border-white/10 max-w-lg mx-auto">
                  <p className="font-mono text-sm text-cabinet-text mb-4">
                    欢迎回来，<span className="text-cabinet-accent">{user.email}</span>
                  </p>
                  <textarea
                    className="w-full h-24 bg-black/50 rounded-lg p-4 font-mono text-sm text-cabinet-text resize-none focus:outline-none focus:ring-2 focus:ring-cabinet-accent/50 border border-white/10 hover:brightness-125 hover:border-cabinet-accent/30 transition-all duration-300"
                    placeholder="输入你的问题或困惑，让思想内阁帮你做出决策..."
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                  />
                  <button
                    onClick={(e) => {
                      console.log('Button clicked!', e);
                      startDecision();
                    }}
                    disabled={!userQuestion.trim()}
                    className="mt-4 w-full px-6 py-2 font-mono text-sm bg-cabinet-accent text-cabinet-bg rounded hover:bg-cabinet-accent/90 transition-colors btn-press disabled:opacity-50 disabled:cursor-not-allowed z-10 relative"
                  >
                    开始决策
                  </button>
                </div>
              )}

              <div className="pt-8">
                <h2 className="font-typewriter text-xl text-cabinet-text mb-6">
                  思想一角
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sampleThoughts.map((thought) => (
                    <div
                      key={thought.id}
                      className="p-4 bg-black/50 rounded-lg border border-white/10 hover:border-cabinet-accent/30 transition-colors"
                    >
                      <span className={`inline-block px-2 py-0.5 text-xs font-mono rounded mb-2 ${
                        thought.type === 'conservative' ? 'bg-amber-500/10 text-amber-400' :
                        thought.type === 'radical' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {thought.type === 'conservative' ? '保守' : thought.type === 'radical' ? '激进' : '理性'}
                      </span>
                      <h3 className="font-typewriter text-base text-cabinet-text mb-2">
                        {thought.name}
                      </h3>
                      <p className="font-mono text-xs text-cabinet-text-secondary line-clamp-3">
                        {thought.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 px-4 border-t border-cabinet-text-secondary/10">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center p-6">
              <div className="text-3xl mb-4">⚖️</div>
              <h3 className="font-typewriter text-lg text-cabinet-accent mb-2">多元思考</h3>
              <p className="font-mono text-xs text-cabinet-text-secondary">
                每一个决定都有多个角度，让不同的声音在辩论中找到真相。
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-4">🔮</div>
              <h3 className="font-typewriter text-lg text-cabinet-accent mb-2">深度探索</h3>
              <p className="font-mono text-xs text-cabinet-text-secondary">
                挖掘你内心深处的想法，理解驱动你决策的真正力量。
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-4">📜</div>
              <h3 className="font-typewriter text-lg text-cabinet-accent mb-2">历史铭记</h3>
              <p className="font-mono text-xs text-cabinet-text-secondary">
                记录每一次思考的轨迹，回顾你的思想成长历程。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
