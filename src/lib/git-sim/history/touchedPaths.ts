import type { ReadCommitResult } from 'isomorphic-git'
import { readCommitFiles } from '@/lib/git-sim/working-tree/treeContents'
import type { CommandContext } from '@/lib/git-sim/types'

type Matcher = (path: string) => boolean

type FilesAt = (oid: string) => Promise<string>

async function matchingFiles(ctx: CommandContext, dir: string, oid: string, matches: Matcher): Promise<string> {
  const files = [...(await readCommitFiles(ctx, dir, oid))].filter(([path]) => matches(path))
  return JSON.stringify(files.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

function rememberedFiles(ctx: CommandContext, dir: string, matches: Matcher): FilesAt {
  const seen = new Map<string, Promise<string>>()
  return (oid) => {
    const files = seen.get(oid) ?? matchingFiles(ctx, dir, oid, matches)
    seen.set(oid, files)
    return files
  }
}

async function touches(entry: ReadCommitResult, filesAt: FilesAt): Promise<boolean> {
  const own = await filesAt(entry.oid)
  const parents = entry.commit.parent
  if (parents.length === 0) return own !== '[]'

  for (const parent of parents) {
    if ((await filesAt(parent)) === own) return false
  }
  return true
}

export async function commitsTouching(
  ctx: CommandContext,
  dir: string,
  commits: readonly ReadCommitResult[],
  matches: Matcher,
): Promise<ReadCommitResult[]> {
  const filesAt = rememberedFiles(ctx, dir, matches)
  const touching: ReadCommitResult[] = []
  for (const entry of commits) {
    if (await touches(entry, filesAt)) touching.push(entry)
  }
  return touching
}
