import { useCallback, useSyncExternalStore } from 'react'
import { initialTabIndex, platformHint } from '@/components/lesson/reading/tabChoice'

const STORAGE_PREFIX = 'git-101-tab:'
const chosen = new Map<string, string>()
const listeners = new Set<() => void>()

function readStored(group: string): string | null {
  const remembered = chosen.get(group)
  if (remembered !== undefined) return remembered
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${group}`)
  } catch {
    return null
  }
}

function storeChoice(group: string, label: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${group}`, label)
    chosen.delete(group)
  } catch {
    chosen.set(group, label)
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function currentHint() {
  return typeof navigator === 'undefined' ? null : platformHint(navigator.userAgent)
}

export default function useTabGroup(group: string, labels: readonly string[]): [number, (index: number) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => readStored(group),
    () => null,
  )

  const select = useCallback(
    (index: number) => {
      const label = labels[index]
      if (label !== undefined) storeChoice(group, label)
    },
    [group, labels],
  )

  return [initialTabIndex(labels, stored, currentHint()), select]
}
