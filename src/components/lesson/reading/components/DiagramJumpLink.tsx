import type { RefObject } from 'react'
import { ArrowDown } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
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
    <Button variant="outlined" size="sm" onClick={handleClick}>
      <ArrowDown size={13} aria-hidden />
      {messages.reading.showDiagram}
    </Button>
  )
}
