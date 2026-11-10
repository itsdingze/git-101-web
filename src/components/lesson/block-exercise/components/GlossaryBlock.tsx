import { useDraggable } from '@dnd-kit/react'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { glossaryDragId } from '@/components/lesson/block-exercise/model/blockDragId'
import { messages } from '@/messages/en'
import { blockShell } from './blockShell'

const FACE = 'bg-bg-card border-border text-text-primary cursor-grab active:cursor-grabbing transition-colors hover:border-text-muted'
const LIFTED = 'bg-border border-border'

interface GlossaryBlockProps {
  block: string
  onAdd: (tile: HTMLButtonElement) => void
  disabled: boolean
  describedBy: string
}

export function GlossaryBlock({ block, onAdd, disabled, describedBy }: GlossaryBlockProps) {
  const { ref, isDragging } = useDraggable({ id: glossaryDragId(block), disabled })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={0}
      onClick={(event) => onAdd(event.currentTarget)}
      aria-label={messages.blocks.add(block)}
      aria-describedby={describedBy}
      className={`${blockShell} border ${isDragging ? LIFTED : FACE} ${FOCUS_RING}`}
      disabled={disabled}
    >
      {isDragging ? <span className="invisible">{block}</span> : block}
    </button>
  )
}
