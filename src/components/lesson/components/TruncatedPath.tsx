import type { ReactNode } from 'react'
import { messages } from '@/messages/en'

interface TruncatedPathProps {
  className: string
  children: ReactNode
}

export function TruncatedPath({ className, children }: TruncatedPathProps) {
  return (
    <div className={`truncate text-left [direction:rtl] ${className}`}>
      <ol dir="ltr" aria-label={messages.reading.path} className="inline">
        {children}
      </ol>
    </div>
  )
}
