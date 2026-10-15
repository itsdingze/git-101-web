import type { ReactNode } from 'react'
import { blockShell } from './blockShell'

interface OverlayBlockProps {
  children: ReactNode
  isPlaced: boolean
}

export function OverlayBlock({ children, isPlaced }: OverlayBlockProps) {
  return (
    <div
      className={`${blockShell} shadow-2xl ${
        isPlaced
          ? 'bg-accent-blue-strong text-text-on-accent'
          : 'bg-bg-card border border-border text-text-primary'
      }`}
    >
      {children}
    </div>
  )
}
