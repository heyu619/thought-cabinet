'use client'

import { useState } from 'react'

export type ThoughtType = 'rational' | 'emotional' | 'radical' | 'conservative' | 'creative' | 'logical'

interface Thought {
  id: string
  name: string
  type: ThoughtType
  description: string
  support: number
}

interface ThoughtCardProps {
  thought: Thought
  onDelete?: (id: string) => void
  showDelete?: boolean
}

const typeColors: Record<ThoughtType, { bg: string; border: string; text: string }> = {
  rational: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400' },
  emotional: { bg: 'bg-pink-500/10', border: 'border-pink-500/50', text: 'text-pink-400' },
  radical: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400' },
  conservative: { bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-400' },
  creative: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-400' },
  logical: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', text: 'text-cyan-400' },
}

const typeLabels: Record<ThoughtType, string> = {
  rational: '理性',
  emotional: '感性',
  radical: '激进',
  conservative: '保守',
  creative: '创意',
  logical: '逻辑',
}

export default function ThoughtCard({ thought, onDelete, showDelete = false }: ThoughtCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = typeColors[thought.type]

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all duration-300 glow-hover ${colors.bg} ${colors.border}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-mono rounded ${colors.bg} ${colors.text}`}>
              {typeLabels[thought.type]}
            </span>
            <h3 className="font-typewriter text-lg text-cabinet-text truncate">
              {thought.name}
            </h3>
          </div>
          <p className="font-mono text-sm text-cabinet-text-secondary leading-relaxed">
            {thought.description}
          </p>
        </div>
        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(thought.id)}
            className="shrink-0 w-6 h-6 flex items-center justify-center text-cabinet-text-secondary hover:text-cabinet-warn transition-colors"
            aria-label="删除思想"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs text-cabinet-text-secondary">支持率</span>
          <span className={`font-mono text-xs ${colors.text}`}>{thought.support}%</span>
        </div>
        <div className="h-1.5 bg-cabinet-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bg.replace('/10', '')}`}
            style={{ width: `${thought.support}%` }}
          />
        </div>
      </div>

      {isHovered && (
        <div className="absolute inset-0 border-2 border-cabinet-accent/30 rounded-lg pointer-events-none" />
      )}
    </div>
  )
}

export type { Thought }
