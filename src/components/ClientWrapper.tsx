'use client'

import { AuthProvider } from '@/context/AuthContext'
import Navigation from './Navigation'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
