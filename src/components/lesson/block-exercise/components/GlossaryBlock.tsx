import { useDraggable } from '@dnd-kit/react'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'
import { blockShell } from './blockShell'

interface GlossaryBlockProps {
  block: string
  isUsed: boolean
  onAdd: (tile: HTMLButtonElement) => void
  disabled: boolean
}

export function GlossaryBlock({ block, isUsed, onAdd, disabled }: GlossaryBlockProps) {
  const { ref } = useDraggable({
    id: `avail-${block}`,
    disabled: isUsed || disabled,
  })

  if (isUsed) {
    return (
      <div className={`${blockShell} bg-border border border-border`}>
        <span className="invisible">{block}</span>
      </div>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => onAdd(event.currentTarget)}
      aria-label={messages.blocks.add(block)}
      className={`${blockShell} bg-bg-card border border-border text-text-primary cursor-grab active:cursor-grabbing transition-colors hover:border-text-muted
        ${FOCUS_RING}`}
      disabled={disabled}
    >
      {block}
    </button>
  )
}
