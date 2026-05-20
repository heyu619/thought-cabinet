'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navigation() {
  const { user, loading, logout } = useAuth()

  const navLinks = [
    { href: '/', label: '首页' },
    { href: '/decision', label: '决策' },
    { href: '/history', label: '历史' },
  ]

  const handleLogout = () => {
    logout()
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

          <div className="flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-cabinet-text-secondary hover:text-cabinet-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {loading ? (
              <div className="w-4 h-4 border-2 border-cabinet-accent border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3 ml-2">
                <span className="text-sm text-cabinet-text-secondary">
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm font-medium text-cabinet-text-secondary hover:text-cabinet-accent transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link 
                  href="/login" 
                  className="px-3 py-1 text-sm font-medium text-cabinet-text-secondary hover:text-cabinet-accent transition-colors"
                >
                  登录
                </Link>
                <Link 
                  href="/register" 
                  className="px-3 py-1 text-sm font-medium text-cabinet-accent hover:text-cabinet-text transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
