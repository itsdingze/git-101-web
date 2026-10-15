import { useMemo, useState } from 'react'
import type { FileEntry, FilesBlock } from '@/types'
import { diskEntries, entriesAt, type FolderLocation } from '@/lib/file-tree/fileTree'
import { homePathFolders } from '@/lib/file-tree/homePath'

const NO_ENTRIES: readonly FileEntry[] = []

interface FinderHistory {
  back: readonly FolderLocation[]
  current: FolderLocation
  forward: readonly FolderLocation[]
}

interface FinderNavigation {
  location: FolderLocation
  entries: readonly FileEntry[]
  canGoBack: boolean
  canGoForward: boolean
  open: (location: FolderLocation) => void
  enter: (folder: string) => void
  goBack: () => void
  goForward: () => void
}

function isSameLocation(a: FolderLocation, b: FolderLocation): boolean {
  return a.length === b.length && a.every((name, index) => name === b[index])
}

function visit(history: FinderHistory, location: FolderLocation): FinderHistory {
  if (isSameLocation(history.current, location)) return history
  return { back: [...history.back, history.current], current: location, forward: [] }
}

function stepBack({ back, current, forward }: FinderHistory): FinderHistory {
  const previous = back[back.length - 1]
  return previous ? { back: back.slice(0, -1), current: previous, forward: [current, ...forward] } : { back, current, forward }
}

function stepForward({ back, current, forward }: FinderHistory): FinderHistory {
  const [next, ...rest] = forward
  return next ? { back: [...back, current], current: next, forward: rest } : { back, current, forward }
}

export function useFinderNavigation(block: FilesBlock): FinderNavigation {
  const [history, setHistory] = useState<FinderHistory>(() => ({ back: [], current: homePathFolders(block.path), forward: [] }))
  const disk = useMemo(() => diskEntries(block.home), [block.home])

  return {
    location: history.current,
    entries: entriesAt(disk, history.current) ?? NO_ENTRIES,
    canGoBack: history.back.length > 0,
    canGoForward: history.forward.length > 0,
    open: (location) => setHistory((previous) => visit(previous, location)),
    enter: (folder) => setHistory((previous) => visit(previous, [...previous.current, folder])),
    goBack: () => setHistory(stepBack),
    goForward: () => setHistory(stepForward),
  }
}
