const STORAGE_PREFIX = 'git-101-tab:'
const unsaved = new Map<string, string>()
const listeners = new Set<() => void>()

export function readTabChoice(group: string): string | null {
  const remembered = unsaved.get(group)
  if (remembered !== undefined) return remembered
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${group}`)
  } catch {
    return null
  }
}

export function chooseTab(group: string, label: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${group}`, label)
    unsaved.delete(group)
  } catch {
    unsaved.set(group, label)
  }
  listeners.forEach((listener) => listener())
}

export function subscribeToTabChoices(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
