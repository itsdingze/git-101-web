import { type KeyboardEvent, useId, useRef } from 'react'
import type { FileEntry } from '@/types'
import type { FolderLocation } from '@/lib/file-tree/fileTree'
import { useFinderSelection } from '@/components/lesson/reading/finder/hooks/useFinderSelection'
import { folderListLabel } from '@/components/lesson/reading/finder/model/finderLabels'
import { FinderItem } from './FinderItem'

function gridColumns(grid: HTMLElement | null): number {
  if (!grid) return 1
  return getComputedStyle(grid).gridTemplateColumns.split(' ').length
}

interface FinderGridProps {
  location: FolderLocation
  entries: readonly FileEntry[]
  onEnter: (folder: string) => void
}

export function FinderGrid({ location, entries, onEnter }: FinderGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const idPrefix = useId()
  const { selected, notePointer, press, doublePress, clear, pressKey } = useFinderSelection(location, entries, onEnter)
  const optionId = (index: number) => `${idPrefix}-${index}`
  const selectedIndex = entries.findIndex((entry) => entry.name === selected)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const command = event.metaKey || event.ctrlKey
    if (pressKey({ key: event.key, command, columns: gridColumns(ref.current) })) event.preventDefault()
  }

  return (
    <div
      ref={ref}
      role="listbox"
      tabIndex={0}
      aria-label={folderListLabel(location, entries.length)}
      aria-activedescendant={selectedIndex < 0 ? undefined : optionId(selectedIndex)}
      onPointerDown={(event) => notePointer(event.pointerType)}
      onClick={(event) => {
        if (event.target === event.currentTarget) clear()
      }}
      onKeyDown={handleKeyDown}
      className="group grid min-h-full touch-manipulation select-none grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] content-start gap-x-2 gap-y-4 p-4 outline-none"
    >
      {entries.map((entry, index) => (
        <FinderItem
          key={entry.name}
          id={optionId(index)}
          entry={entry}
          selected={entry.name === selected}
          onPress={press}
          onDoublePress={doublePress}
        />
      ))}
    </div>
  )
}
