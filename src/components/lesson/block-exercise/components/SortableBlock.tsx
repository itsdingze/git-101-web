import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'
import { blockShell } from './blockShell'

interface SortableBlockProps {
  id: string
  index: number
  children: ReactNode
  onRemove: (tile: HTMLButtonElement) => void
  disabled: boolean
}

export function SortableBlock({ id, index, children, onRemove, disabled }: SortableBlockProps) {
  const { ref, isDragging } = useSortable({ id, index, group: 'solution-area', disabled })

  if (isDragging) {
    return (
      <div ref={ref} className={`${blockShell} bg-border`}>
        <span className="invisible">{children}</span>
      </div>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      data-block={id}
      aria-label={messages.blocks.remove(id)}
      onClick={(event) => onRemove(event.currentTarget)}
      onKeyDown={(e) => { if (e.key === ' ') e.preventDefault() }}
      className={`${blockShell} bg-accent-blue text-text-on-accent cursor-grab active:cursor-grabbing ${FOCUS_RING}`}
    >
      {children}
    </button>
  )
}
