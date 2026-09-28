import type { RefObject } from 'react'
import { ArrowDown } from 'lucide-react'

interface DiagramJumpLinkProps {
  target: RefObject<HTMLDivElement | null>
}

export default function DiagramJumpLink({ target }: DiagramJumpLinkProps) {
  function handleClick() {
    target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
    >
      <ArrowDown size={13} aria-hidden />
      Interactive diagram below
    </button>
  )
}
