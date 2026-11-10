import type { ReadCommitResult } from 'isomorphic-git'
import { pathExists, readText, writeText } from '@/lib/git-sim/fs/fileOperations'
import { joinPath } from '@/lib/git-sim/fs/paths'
import type { CommandContext } from '@/lib/git-sim/types'

const SHALLOW_FILE = '.git/shallow'

export async function readShallowBoundary(ctx: CommandContext, dir: string): Promise<Set<string>> {
  const path = joinPath(dir, SHALLOW_FILE)
  if (!(await pathExists(ctx.fs, path))) return new Set()
  return new Set((await readText(ctx.fs, path)).split('\n').filter(Boolean))
}

export async function writeShallowBoundary(ctx: CommandContext, dir: string, oids: ReadonlySet<string>): Promise<void> {
  if (oids.size === 0) return
  await writeText(ctx.fs, joinPath(dir, SHALLOW_FILE), [...oids].map((oid) => `${oid}\n`).join(''))
}

export function withoutHiddenParents(entry: ReadCommitResult, boundary: ReadonlySet<string>): ReadCommitResult {
  return boundary.has(entry.oid) ? { ...entry, commit: { ...entry.commit, parent: [] } } : entry
}
