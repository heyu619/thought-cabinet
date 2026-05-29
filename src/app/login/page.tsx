'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const getErrorMessage = (error: string): string => {
  if (error.includes('email not confirmed')) {
    return '邮箱尚未验证，请检查邮箱并点击验证链接'
  }
  if (error.includes('invalid login credentials')) {
    return '邮箱或密码错误，请检查后重试'
  }
  return error || '登录失败'
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const sessionExpired = searchParams.get('session_expired')
    if (sessionExpired === 'true') {
      setError('您的会话已过期，请重新登录')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('请填写所有字段')
      return
    }

    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.push('/')
    } else {
      setError(getErrorMessage(result.error || ''))
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔑</div>
          <h1 className="font-typewriter text-2xl text-cabinet-accent mb-2">
            登录思想内阁
          </h1>
          <p className="font-mono text-sm text-cabinet-text-secondary">
            进入你的思想殿堂
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
              placeholder="输入密码..."
              className="w-full px-4 py-3 bg-cabinet-card border border-cabinet-text-secondary/30 rounded-lg font-mono text-cabinet-text placeholder:text-cabinet-text-secondary/50 focus:outline-none focus:border-cabinet-accent transition-colors"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-cabinet-accent text-cabinet-bg font-typewriter text-lg rounded-lg hover:bg-cabinet-accent/90 transition-colors btn-press disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="font-mono text-sm text-cabinet-text-secondary">
            还没有账号？{' '}
            <Link
              href="/register"
              className="text-cabinet-accent hover:underline"
            >
              立即注册
            </Link>
          </p>
        </div>

        <div className="mt-8 p-4 bg-cabinet-card/30 rounded-lg border border-cabinet-text-secondary/10">
          <p className="font-mono text-xs text-cabinet-text-secondary text-center">
            "思想的内阁永远为你敞开大门。"
          </p>
        </div>
      </div>
    </div>
  )
}
