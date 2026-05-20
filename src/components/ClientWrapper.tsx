'use client'

import dynamic from 'next/dynamic'
import { AuthProvider } from '@/context/AuthContext'

const Navigation = dynamic(() => import('./Navigation'), {
  ssr: false,
})

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
