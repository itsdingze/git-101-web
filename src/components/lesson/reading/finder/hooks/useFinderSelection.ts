import { useRef, useState } from 'react'
import type { FileEntry } from '@/types'
import type { FolderLocation } from '@/lib/file-tree/fileTree'

const TOUCH = 'touch'

interface KeyPress {
  key: string
  command: boolean
  columns: number
}

interface FinderSelection {
  selected: string | null
  notePointer: (pointerType: string) => void
  press: (entry: FileEntry) => void
  doublePress: (entry: FileEntry) => void
  clear: () => void
  pressKey: (press: KeyPress) => boolean
}

type Move = (index: number, count: number, columns: number) => number

const MOVES: Readonly<Record<string, Move>> = {
  ArrowRight: (index, count) => Math.min(index + 1, count - 1),
  ArrowLeft: (index) => Math.max(index - 1, 0),
  ArrowDown: (index, count, columns) => (index + columns < count ? index + columns : index),
  ArrowUp: (index, _count, columns) => (index - columns >= 0 ? index - columns : index),
}

function movedIndex(key: string, index: number, count: number, columns: number): number | null {
  const move = MOVES[key]
  if (!move) return null
  return index < 0 ? 0 : move(index, count, columns)
}

function isOpenKey(key: string, command: boolean): boolean {
  return key === 'Enter' || (command && key === 'ArrowDown')
}

export function useFinderSelection(
  location: FolderLocation,
  entries: readonly FileEntry[],
  enter: (folder: string) => void,
): FinderSelection {
  const folderKey = location.join('/')
  const [selection, setSelection] = useState<{ in: string; name: string | null }>({ in: folderKey, name: null })
  const selected = selection.in === folderKey ? selection.name : null
  const pointerType = useRef<string | null>(null)

  function setSelected(name: string | null) {
    setSelection({ in: folderKey, name })
  }

  function open(entry: FileEntry) {
    if (entry.kind === 'folder') enter(entry.name)
  }

  function pressKey({ key, command, columns }: KeyPress): boolean {
    const index = entries.findIndex((entry) => entry.name === selected)
    if (isOpenKey(key, command)) {
      const entry = entries[index]
      if (entry?.kind !== 'folder') return false
      open(entry)
      return true
    }
    const next = movedIndex(key, index, entries.length, columns)
    const target = next === null ? undefined : entries[next]
    if (!target) return false
    setSelected(target.name)
    return true
  }

  return {
    selected,
    notePointer: (type) => {
      pointerType.current = type
    },
    press: (entry) => {
      setSelected(entry.name)
      if (pointerType.current === TOUCH) open(entry)
    },
    doublePress: open,
    clear: () => setSelected(null),
    pressKey,
  }
}
