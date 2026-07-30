import type { ReactNode } from 'react'
import useScrollableRegion from '@/hooks/useScrollableRegion'

const base =
  'overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue'

interface CodeBlockProps {
  children: ReactNode
  label: string
  className?: string
}

export default function CodeBlock({ children, label, className = '' }: CodeBlockProps) {
  const { ref, regionProps } = useScrollableRegion<HTMLPreElement>(label)

  return (
    <pre ref={ref} {...regionProps} className={`${base} ${className}`}>
      {children}
    </pre>
  )
}
