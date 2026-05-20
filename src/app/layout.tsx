import type { Metadata } from 'next'
import { Special_Elite, IBM_Plex_Mono, Noto_Serif_SC } from 'next/font/google'
import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'

const specialElite = Special_Elite({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-special-elite',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-ibm-plex-mono',
})

const notoSerif = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
})

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
    <html lang="zh-CN">
      <body className={`${specialElite.variable} ${ibmPlexMono.variable} ${notoSerif.variable}`}>
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
