import git from 'isomorphic-git'
import { gitFs, type SandboxFs } from '@/lib/git-sim/fs/sandboxFs'

export type ConfigEntry = { key: string; value: string }

export type ConfigScope = {
  values: (key: string) => Promise<string[]>
  add: (key: string, value: string) => Promise<void>
  replaceWhere: (key: string, matches: (value: string) => boolean, value: string) => Promise<void>
  removeAll: (key: string) => Promise<void>
}

function sectionOf(key: string): string {
  return key.slice(0, key.lastIndexOf('.'))
}

function valuesIn(entries: readonly ConfigEntry[], key: string): string[] {
  return entries.filter((entry) => entry.key === key).map((entry) => entry.value)
}

export function lastValueIn(entries: readonly ConfigEntry[], key: string): string | undefined {
  const values = valuesIn(entries, key)
  return values[values.length - 1]
}

function endOfSection(entries: readonly ConfigEntry[], key: string): number {
  const section = sectionOf(key)
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (sectionOf(entries[index]?.key ?? '') === section) return index + 1
  }
  return entries.length
}

function addTo(entries: ConfigEntry[], key: string, value: string): void {
  entries.splice(endOfSection(entries, key), 0, { key, value })
}

function removeAllFrom(entries: ConfigEntry[], key: string): void {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.key === key) entries.splice(index, 1)
  }
}

export function setOnlyValue(entries: ConfigEntry[], key: string, value: string): void {
  removeAllFrom(entries, key)
  if (value !== '') addTo(entries, key, value)
}

export function globalScope(entries: ConfigEntry[]): ConfigScope {
  return {
    values: (key) => Promise.resolve(valuesIn(entries, key)),
    add: (key, value) => {
      addTo(entries, key, value)
      return Promise.resolve()
    },
    replaceWhere: (key, matches, value) => {
      for (const entry of entries) {
        if (entry.key === key && matches(entry.value)) entry.value = value
      }
      return Promise.resolve()
    },
    removeAll: (key) => {
      removeAllFrom(entries, key)
      return Promise.resolve()
    },
  }
}

export function projectScope(fs: SandboxFs, dir: string): ConfigScope {
  const repo = { fs: gitFs(fs), dir }
  const values = async (key: string): Promise<string[]> => {
    const all: unknown[] = await git.getConfigAll({ ...repo, path: key })
    return all.filter((value): value is string => typeof value === 'string')
  }
  const removeAll = async (key: string): Promise<void> => {
    for (let count = (await values(key)).length; count > 0; count -= 1) {
      await git.setConfig({ ...repo, path: key, value: undefined })
    }
  }
  const add = async (key: string, value: string): Promise<void> => {
    await git.setConfig({ ...repo, path: key, value, append: true })
  }

  return {
    values,
    add,
    replaceWhere: async (key, matches, value) => {
      const replaced = (await values(key)).map((existing) => (matches(existing) ? value : existing))
      await removeAll(key)
      for (const kept of replaced) await add(key, kept)
    },
    removeAll,
  }
}
