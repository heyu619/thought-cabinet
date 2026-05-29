'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExpiredAlert, setShowExpiredAlert] = useState(false)

  const handleSessionExpired = useCallback(() => {
    if (!showExpiredAlert) {
      setShowExpiredAlert(true)
      setTimeout(() => {
        setShowExpiredAlert(false)
        window.location.href = '/login?session_expired=true'
      }, 3000)
    }
  }, [showExpiredAlert])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('获取会话失败:', error.message)
        }
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('获取会话时发生异常:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in')
          break
        case 'SIGNED_OUT':
          console.log('User signed out')
          break
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully')
          break
        case 'USER_UPDATED':
          console.log('User updated')
          break
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery initiated')
          break
      }

      if (!session?.user && user) {
        console.warn('Session expired or user logged out')
        handleSessionExpired()
      }

      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [handleSessionExpired])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error('登录失败:', error.message)
        return { success: false, error: error.message }
      }
      return { success: !!data.user }
    } catch (err) {
      console.error('登录时发生异常:', err)
      return { success: false, error: '登录过程中发生错误，请稍后重试' }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      })
      if (error) {
        console.error('注册失败:', error.message)
        return { success: false, error: error.message }
      }
      return { success: true, needsVerification: !data.user?.email_confirmed_at }
    } catch (err) {
      console.error('注册时发生异常:', err)
      return { success: false, error: '注册过程中发生错误，请稍后重试' }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('登出时发生异常:', err)
    }
  }

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('刷新会话失败:', error.message)
        if (error.message.includes('Refresh Token Not Found') || 
            error.message.includes('invalid refresh token')) {
          handleSessionExpired()
          return false
        }
        return false
      }
      return true
    } catch (err) {
      console.error('刷新会话时发生异常:', err)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshSession }}>
      {children}
      
      {showExpiredAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-cabinet-card border border-cabinet-accent/30 rounded-xl p-6 max-w-sm w-full mx-4 text-center animate-fade-in">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="font-typewriter text-lg text-cabinet-accent mb-2">
              会话已过期
            </h2>
            <p className="font-mono text-sm text-cabinet-text-secondary">
              您的登录会话已过期，请重新登录
            </p>
            <div className="mt-4 h-1 bg-cabinet-bg rounded-full overflow-hidden">
              <div className="h-full bg-cabinet-accent animate-[slide_3s_linear_forwards]" />
            </div>
            <style>{`
              @keyframes slide {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
