import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'
import { blockShell } from './blockShell'

const FACE = 'bg-accent-blue text-text-on-accent cursor-grab active:cursor-grabbing aria-disabled:cursor-default'
const LIFTED = 'bg-border'

interface SortableBlockProps {
  id: string
  index: number
  children: ReactNode
  onRemove: (tile: HTMLButtonElement) => void
  disabled: boolean
  describedBy: string | undefined
}

export function SortableBlock({ id, index, children, onRemove, disabled, describedBy }: SortableBlockProps) {
  const { ref, isDragging } = useSortable({ id, index, group: 'solution-area', disabled })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={0}
      data-block={id}
      aria-label={messages.blocks.remove(id)}
      aria-describedby={describedBy}
      aria-disabled={disabled || undefined}
      onClick={(event) => onRemove(event.currentTarget)}
      onKeyDown={(e) => { if (e.key === ' ') e.preventDefault() }}
      className={`${blockShell} ${isDragging ? LIFTED : FACE} ${FOCUS_RING}`}
    >
      {isDragging ? <span className="invisible">{children}</span> : children}
    </button>
  )
}
