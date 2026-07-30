import type { ReactNode } from 'react'
import blockShell from './blockShell'

interface OverlayBlockProps {
  children: ReactNode
  isPlaced: boolean
}

export default function OverlayBlock({ children, isPlaced }: OverlayBlockProps) {
  return (
    <div
      className={`${blockShell} shadow-2xl ${
        isPlaced
          ? 'bg-accent-blue text-white'
          : 'bg-bg-card border border-border text-text-primary'
      }`}
    >
      {children}
    </div>
  )
}
