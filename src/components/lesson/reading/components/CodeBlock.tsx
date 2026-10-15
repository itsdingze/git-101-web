import type { ReactNode } from 'react'
import { useScrollableRegion } from '@/components/lesson/reading/hooks/useScrollableRegion'
import { FOCUS_RING } from '@/components/ui/focusRing'

const base = `overflow-x-auto ${FOCUS_RING}`

interface CodeBlockProps {
  children: ReactNode
  label: string
  className?: string
}

export function CodeBlock({ children, label, className = '' }: CodeBlockProps) {
  const { ref, regionProps } = useScrollableRegion<HTMLPreElement>(label)

  return (
    <pre ref={ref} {...regionProps} className={`${base} ${className}`}>
      {children}
    </pre>
  )
}
