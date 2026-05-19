'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !confirmPassword) {
      setError('请填写所有字段')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)

    const result = await register(email, password)

    if (result.success) {
      if (result.needsVerification) {
        setError('')
        setShowVerification(true)
      } else {
        router.push('/')
      }
    } else {
      setError(result.error || '注册失败')
    }
    setIsLoading(false)
  }

  const [showVerification, setShowVerification] = useState(false)

  if (showVerification) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="font-typewriter text-2xl text-cabinet-accent mb-4">
            验证邮箱
          </h1>
          <p className="font-mono text-sm text-cabinet-text-secondary mb-6">
            我们已向 <span className="text-cabinet-accent">{email}</span> 发送了一封验证邮件。
            <br />
            <br />
            请点击邮件中的链接完成验证，然后即可登录。
          </p>
          <div className="p-4 bg-cabinet-card/30 rounded-lg border border-cabinet-text-secondary/10">
            <p className="font-mono text-xs text-cabinet-text-secondary">
              "验证你的思想，开启智慧之门。"
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">✍️</div>
          <h1 className="font-typewriter text-2xl text-cabinet-accent mb-2">
            加入思想内阁
          </h1>
          <p className="font-mono text-sm text-cabinet-text-secondary">
            开启你的思想辩论之旅
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-cabinet-warn/10 border border-cabinet-warn/30 rounded-lg">
              <p className="font-mono text-xs text-cabinet-warn text-center">
                {error}
              </p>
            </div>
          )}

          <div>
            <label className="block font-mono text-xs text-cabinet-text-secondary mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入邮箱地址..."
              className="w-full px-4 py-3 bg-cabinet-card border border-cabinet-text-secondary/30 rounded-lg font-mono text-cabinet-text placeholder:text-cabinet-text-secondary/50 focus:outline-none focus:border-cabinet-accent transition-colors"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-cabinet-text-secondary mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="创建一个密码..."
              className="w-full px-4 py-3 bg-cabinet-card border border-cabinet-text-secondary/30 rounded-lg font-mono text-cabinet-text placeholder:text-cabinet-text-secondary/50 focus:outline-none focus:border-cabinet-accent transition-colors"
              disabled={isLoading}
            />
            <p className="mt-1 font-mono text-xs text-cabinet-text-secondary">
              至少6个字符
            </p>
          </div>

          <div>
            <label className="block font-mono text-xs text-cabinet-text-secondary mb-2">
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码..."
              className="w-full px-4 py-3 bg-cabinet-card border border-cabinet-text-secondary/30 rounded-lg font-mono text-cabinet-text placeholder:text-cabinet-text-secondary/50 focus:outline-none focus:border-cabinet-accent transition-colors"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-cabinet-accent text-cabinet-bg font-typewriter text-lg rounded-lg hover:bg-cabinet-accent/90 transition-colors btn-press disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="font-mono text-sm text-cabinet-text-secondary">
            已有账号？{' '}
            <Link
              href="/login"
              className="text-cabinet-accent hover:underline"
            >
              立即登录
            </Link>
          </p>
        </div>

        <div className="mt-8 p-4 bg-cabinet-card/30 rounded-lg border border-cabinet-text-secondary/10">
          <p className="font-mono text-xs text-cabinet-text-secondary text-center">
            "每一个新的思想都值得被倾听。"
          </p>
        </div>
      </div>
    </div>
  )
}
