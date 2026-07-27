import type { ReactNode } from 'react'

interface ContentColumnProps {
  children: ReactNode
  className?: string
}

export default function ContentColumn({ children, className = '' }: ContentColumnProps) {
  return (
    <div className={`w-full max-w-content mx-auto px-6 sm:px-8 ${className}`}>
      {children}
    </div>
  )
}
