import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import blockShell from './blockShell'

interface SortableBlockProps {
  id: string
  index: number
  children: ReactNode
  onRemove: () => void
  disabled: boolean
}

export default function SortableBlock({ id, index, children, onRemove, disabled }: SortableBlockProps) {
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
      data-block
      aria-label={`Remove ${id} from your answer`}
      onClick={onRemove}
      onKeyDown={(e) => { if (e.key === ' ') e.preventDefault() }}
      className={`${blockShell} bg-accent-blue text-white cursor-grab active:cursor-grabbing
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue-dark`}
    >
      {children}
    </button>
  )
}
