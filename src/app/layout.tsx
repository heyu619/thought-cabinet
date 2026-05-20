import type { Metadata } from 'next'
import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'

export const metadata: Metadata = {
  title: 'Ribs Disco | Thought Cabinet',
  description: '一个模拟思想辩论和决策的系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-mono">
        <ClientWrapper>
          {children}
        </ClientWrapper>
        <footer className="py-6 px-4 border-t border-cabinet-text-secondary/20">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-typewriter text-cabinet-text-secondary text-sm">
              "在思想的内阁中，每一个声音都值得被倾听。"
            </p>
            <p className="font-mono text-cabinet-text-secondary/50 text-xs mt-2">
              © 2026 Ribs Disco System
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
