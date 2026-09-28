import { joinPath } from './paths'
import { pathExists, readText, removeTree, writeText } from './fileOperations'
import type { CommandContext } from './types'

export type MergeInProgress = {
  theirs: string
  conflicted: string[]
}

const MERGE_HEAD = '.git/MERGE_HEAD'
const MERGE_CONFLICTS = '.git/MERGE_CONFLICTS'

async function readRecord(ctx: CommandContext, dir: string, name: string): Promise<string> {
  const path = joinPath(dir, name)
  return (await pathExists(ctx.fs, path)) ? readText(ctx.fs, path) : ''
}

export async function beginMerge(
  ctx: CommandContext,
  dir: string,
  merge: MergeInProgress,
): Promise<void> {
  await writeText(ctx.fs, joinPath(dir, MERGE_HEAD), `${merge.theirs}\n`)
  await writeText(
    ctx.fs,
    joinPath(dir, MERGE_CONFLICTS),
    merge.conflicted.map((path) => `${path}\n`).join(''),
  )
}

export async function readMergeInProgress(
  ctx: CommandContext,
  dir: string,
): Promise<MergeInProgress | null> {
  const theirs = (await readRecord(ctx, dir, MERGE_HEAD)).trim()
  if (!theirs) return null

  return {
    theirs,
    conflicted: (await readRecord(ctx, dir, MERGE_CONFLICTS)).split('\n').filter(Boolean),
  }
}

export async function endMerge(ctx: CommandContext, dir: string): Promise<void> {
  for (const name of [MERGE_HEAD, MERGE_CONFLICTS]) {
    const path = joinPath(dir, name)
    if (await pathExists(ctx.fs, path)) await removeTree(ctx.fs, path)
  }
}
