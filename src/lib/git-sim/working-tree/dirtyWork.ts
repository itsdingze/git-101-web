import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, readText, removeTree, writeText } from '@/lib/git-sim/fs/fileOperations'
import { readIndexFiles } from './treeContents'
import { readWorkingTree, type ChangeKind } from './workingTree'
import type { CommandContext } from '@/lib/git-sim/types'

type DirtyEntry = {
  path: string
  staged: ChangeKind | null
  indexContent: string | null
  workdirContent: string | null
}

export type DirtyWork = {
  entries: DirtyEntry[]
  untracked: string[]
}

export async function readDirtyWork(ctx: CommandContext, dir: string): Promise<DirtyWork> {
  const tree = await readWorkingTree(ctx, dir)
  const index = await readIndexFiles(ctx, dir)
  const stagedKinds = new Map(tree.staged.map((change) => [change.path, change.kind]))
  const paths = [...new Set([...tree.staged, ...tree.unstaged].map((change) => change.path))].sort()

  const entries: DirtyEntry[] = []
  for (const path of paths) {
    const absolute = joinPath(dir, path)
    entries.push({
      path,
      staged: stagedKinds.get(path) ?? null,
      indexContent: index.get(path) ?? null,
      workdirContent: (await pathExists(ctx.fs, absolute)) ? await readText(ctx.fs, absolute) : null,
    })
  }
  return { entries, untracked: tree.untracked }
}

export function stagedPaths(work: DirtyWork): string[] {
  return work.entries.filter((entry) => entry.staged !== null).map((entry) => entry.path)
}

export function dirtyPathsIn(work: DirtyWork, touched: ReadonlySet<string>): string[] {
  return work.entries.map((entry) => entry.path).filter((path) => touched.has(path))
}

export type UntrackedClash = {
  overwritten: string[]
  lostFolders: string[]
}

export function untrackedClashesIn(work: DirtyWork, touched: ReadonlySet<string>): UntrackedClash {
  const touchedPaths = [...touched]
  return {
    overwritten: work.untracked.filter(
      (path) => touched.has(path) || touchedPaths.some((changed) => changed.startsWith(`${path}/`)),
    ),
    lostFolders: touchedPaths.filter((changed) => work.untracked.some((path) => path.startsWith(`${changed}/`))).sort(),
  }
}

export function lostFoldersRefusal(folders: readonly string[]): string[] {
  return [
    'error: Updating the following directories would lose untracked files in them:',
    ...folders.map((folder) => `\t${folder}`),
    '',
    'Aborting',
  ]
}

async function writeOrRemove(ctx: CommandContext, absolute: string, contents: string | null): Promise<void> {
  if (contents !== null) await writeText(ctx.fs, absolute, contents)
  else if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
}

export async function restoreDirtyWork(ctx: CommandContext, dir: string, work: DirtyWork): Promise<void> {
  const fs = gitFs(ctx.fs)
  for (const entry of work.entries) {
    const absolute = joinPath(dir, entry.path)
    if (entry.staged === 'deleted') {
      await git.remove({ fs, dir, filepath: entry.path })
    } else if (entry.staged !== null && entry.indexContent !== null) {
      await writeText(ctx.fs, absolute, entry.indexContent)
      await git.add({ fs, dir, filepath: entry.path, force: true })
    }
    await writeOrRemove(ctx, absolute, entry.workdirContent)
  }
}

export function changedPaths(before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>): Set<string> {
  const paths = new Set([...before.keys(), ...after.keys()])
  return new Set([...paths].filter((path) => before.get(path) !== after.get(path)))
}

export function carriedChangeLines(work: DirtyWork): string[] {
  return work.entries.map((entry) => {
    const kind = entry.staged ?? (entry.workdirContent === null ? 'deleted' : 'modified')
    const letter = kind === 'new' ? 'A' : kind === 'deleted' ? 'D' : 'M'
    return `${letter}\t${entry.path}`
  })
}
