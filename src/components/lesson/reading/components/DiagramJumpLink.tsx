import type { RefObject } from 'react'
import { ArrowDown } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'

interface DiagramJumpLinkProps {
  target: RefObject<HTMLDivElement | null>
}

export function DiagramJumpLink({ target }: DiagramJumpLinkProps) {
  const prefersReduced = useReducedMotion()

  function handleClick() {
    target.current?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs text-text-secondary hover:text-text-primary ${FOCUS_RING}`}
    >
      <ArrowDown size={13} aria-hidden />
      {messages.reading.showDiagram}
    </button>
  )
}
