import { useEffect, useRef } from 'react'
import type { FileEntry } from '@/types'
import { entryLabel } from '@/components/lesson/reading/finder/model/finderLabels'
import { FinderIcon } from './FinderIcon'

const SELECTED_NAME = 'bg-finder-selection-inactive text-text-primary group-focus:bg-finder-selection group-focus:text-text-on-accent'

interface FinderItemProps {
  id: string
  entry: FileEntry
  selected: boolean
  onPress: (entry: FileEntry) => void
  onDoublePress: (entry: FileEntry) => void
}

export function FinderItem({ id, entry, selected, onPress, onDoublePress }: FinderItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const nameColor = entry.hidden ? 'text-text-muted' : 'text-text-primary'

  return (
    <div
      ref={ref}
      id={id}
      role="option"
      aria-selected={selected}
      aria-label={entryLabel(entry)}
      onClick={() => onPress(entry)}
      onDoubleClick={() => onDoublePress(entry)}
      className="flex cursor-pointer flex-col items-center gap-1"
    >
      <span className={`rounded-md p-0.5 ${selected ? 'bg-finder-icon-selected' : ''} ${entry.hidden ? 'opacity-50' : ''}`}>
        <FinderIcon kind={entry.kind} />
      </span>
      <span
        className={`line-clamp-2 max-w-full rounded px-1 text-center font-sans text-xs leading-snug wrap-anywhere ${selected ? SELECTED_NAME : nameColor}`}
      >
        {entry.name}
      </span>
    </div>
  )
}
