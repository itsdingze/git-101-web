import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { isDirectory, pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import { commitSignature } from '@/lib/git-sim/history/repository'
import { readWorkingTree } from '@/lib/git-sim/working-tree/workingTree'
import { changedPaths } from '@/lib/git-sim/working-tree/dirtyWork'
import { readCommitFilesOrEmpty, readIndexFiles } from '@/lib/git-sim/working-tree/treeContents'
import { writeFilesTree } from '@/lib/git-sim/working-tree/treeWriter'
import { forceCheckout } from '@/lib/git-sim/working-tree/forceCheckout'
import { placeFile } from '@/lib/git-sim/fs/pathBlockers'
import { SandboxError } from '@/lib/git-sim/errors'
import type { PathLimit } from './stashPaths'
import type { CommandContext } from '@/lib/git-sim/types'

type Shelving = {
  branch: string
  head: string
  headLine: string
  message: string
  untracked: readonly string[]
  limit: PathLimit | null
}

type Files = Map<string, string>

type SavedState = {
  committed: Files
  indexed: Files
  worktree: Files
  untracked: Files
}

async function readFileOrNull(ctx: CommandContext, dir: string, path: string): Promise<string | null> {
  const absolute = joinPath(dir, path)
  return (await pathExists(ctx.fs, absolute)) ? readText(ctx.fs, absolute) : null
}

async function currentWorkTree(ctx: CommandContext, dir: string, committed: Files, indexed: Files): Promise<Files> {
  const tree = await readWorkingTree(ctx, dir)
  const touched = new Set([...changedPaths(committed, indexed), ...tree.unstaged.map((change) => change.path)])

  const files = new Map(committed)
  for (const path of touched) {
    if (await isDirectory(ctx.fs, joinPath(dir, path))) continue
    const contents = await readFileOrNull(ctx, dir, path)
    if (contents === null) files.delete(path)
    else files.set(path, contents)
  }
  return files
}

async function readUntracked(ctx: CommandContext, dir: string, paths: readonly string[]): Promise<Files> {
  const files = new Map<string, string>()
  for (const path of paths) {
    const contents = await readFileOrNull(ctx, dir, path)
    if (contents !== null) files.set(path, contents)
  }
  return files
}

function applyInScope(base: Files, next: Files, inScope: PathLimit): Files {
  const result = new Map(base)
  for (const path of changedPaths(base, next)) {
    if (!inScope(path)) continue
    const contents = next.get(path)
    if (contents === undefined) result.delete(path)
    else result.set(path, contents)
  }
  return result
}

async function writeShelfCommit(
  ctx: CommandContext,
  dir: string,
  files: ReadonlyMap<string, string>,
  parent: string[],
  message: string,
): Promise<string> {
  const tree = await writeFilesTree(ctx, dir, files)
  const author = await commitSignature(ctx, dir)
  return git.writeCommit({ fs: gitFs(ctx.fs), dir, commit: { tree, parent, author, committer: author, message: `${message}\n` } })
}

async function resetPaths(ctx: CommandContext, dir: string, state: SavedState, inScope: PathLimit): Promise<void> {
  const fs = gitFs(ctx.fs)
  const shelved = new Set([...changedPaths(state.committed, state.indexed), ...changedPaths(state.committed, state.worktree)])
  for (const path of [...shelved].filter(inScope)) {
    await placeFile(ctx, dir, path, state.committed.get(path))
    if (state.committed.has(path)) await git.resetIndex({ fs, dir, filepath: path })
    else if (state.indexed.has(path)) await git.remove({ fs, dir, filepath: path })
  }
}

async function resetShelved(ctx: CommandContext, dir: string, shelving: Shelving, state: SavedState): Promise<void> {
  for (const path of state.untracked.keys()) {
    if (!state.committed.has(path)) await placeFile(ctx, dir, path, undefined)
  }

  if (shelving.limit === null) await forceCheckout(ctx, dir, shelving.branch)
  else await resetPaths(ctx, dir, state, shelving.limit)
}

async function putBack(ctx: CommandContext, dir: string, state: SavedState): Promise<void> {
  const fs = gitFs(ctx.fs)
  const listed = await git.listFiles({ fs, dir })
  const paths = new Set([...listed, ...state.indexed.keys(), ...state.worktree.keys()])

  for (const path of paths) {
    const staged = state.indexed.get(path)
    if (staged !== undefined) {
      await placeFile(ctx, dir, path, staged)
      await git.add({ fs, dir, filepath: path })
    } else if (listed.includes(path)) {
      await git.remove({ fs, dir, filepath: path })
    }
    await placeFile(ctx, dir, path, state.worktree.get(path))
  }
  for (const [path, contents] of state.untracked) await placeFile(ctx, dir, path, contents)
}

export async function shelveWork(ctx: CommandContext, dir: string, shelving: Shelving): Promise<string> {
  const inScope: PathLimit = shelving.limit ?? (() => true)
  const committed = await readCommitFilesOrEmpty(ctx, dir, shelving.head)
  const indexed = await readIndexFiles(ctx, dir)
  const state: SavedState = {
    committed,
    indexed,
    worktree: await currentWorkTree(ctx, dir, committed, indexed),
    untracked: await readUntracked(ctx, dir, shelving.untracked),
  }

  const indexOid = await writeShelfCommit(
    ctx,
    dir,
    applyInScope(committed, indexed, inScope),
    [shelving.head],
    `index on ${shelving.branch}: ${shelving.headLine}`,
  )
  const untrackedParents =
    state.untracked.size === 0
      ? []
      : [await writeShelfCommit(ctx, dir, state.untracked, [], `untracked files on ${shelving.branch}: ${shelving.headLine}`)]
  const oid = await writeShelfCommit(
    ctx,
    dir,
    applyInScope(committed, state.worktree, inScope),
    [shelving.head, indexOid, ...untrackedParents],
    shelving.message,
  )

  try {
    await resetShelved(ctx, dir, shelving, state)
  } catch {
    await putBack(ctx, dir, state)
    throw new SandboxError("error: couldn't save your local changes, so nothing was stashed. Your files are as you left them.")
  }
  return oid
}
