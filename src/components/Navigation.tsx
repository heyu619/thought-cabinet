'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Navigation() {
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const { user, logout, loading } = useAuth()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const navLinks = [
    { href: '/', label: '首页' },
    { href: '/decision', label: '决策' },
    { href: '/history', label: '历史' },
  ]

  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    await logout()
  }

  if (!isClient) {
    return (
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🧠</span>
              <span className="font-typewriter text-xl text-cabinet-accent tracking-wider hidden sm:block group-hover:text-cabinet-text transition-colors">
                Ribs Disco
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cabinet-accent border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🧠</span>
              <span className="font-typewriter text-xl text-cabinet-accent tracking-wider hidden sm:block group-hover:text-cabinet-text transition-colors">
                Ribs Disco
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cabinet-accent border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🧠</span>
            <span className="font-typewriter text-xl text-cabinet-accent tracking-wider hidden sm:block group-hover:text-cabinet-text transition-colors">
              Ribs Disco
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 font-mono text-sm transition-all duration-200 border-b-2 ${
                  isActive(link.href)
                    ? 'border-cabinet-accent text-cabinet-accent'
                    : 'border-transparent text-cabinet-text-secondary hover:text-cabinet-text hover:border-cabinet-text-secondary/50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="ml-2 pl-2 sm:pl-6 border-l border-cabinet-text-secondary/20">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-cabinet-text-secondary hidden sm:block">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 font-mono text-xs text-cabinet-warn border border-cabinet-warn/50 rounded hover:bg-cabinet-warn/10 transition-colors btn-press"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={`px-3 py-1.5 font-mono text-xs transition-colors border-b-2 ${
                      isActive('/login')
                        ? 'border-cabinet-accent text-cabinet-accent'
                        : 'border-transparent text-cabinet-text-secondary hover:text-cabinet-text'
                    }`}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className={`px-3 py-1.5 font-mono text-xs rounded transition-all btn-press ${
                      isActive('/register')
                        ? 'bg-cabinet-accent text-cabinet-bg'
                        : 'bg-cabinet-accent/20 text-cabinet-accent hover:bg-cabinet-accent/30'
                    }`}
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
