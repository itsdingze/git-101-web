import { SandboxError } from '@/lib/git-sim/errors'
import { shortOid } from '@/lib/git-sim/history/repository'
import {
  dirtyPathsIn,
  stagedPaths,
  untrackedClashesIn,
  type DirtyWork,
} from '@/lib/git-sim/working-tree/dirtyWork'

const ORT_FAILED = 'Merge with strategy ort failed.'

export function overwriteRefusal(paths: readonly string[]): string[] {
  return [
    'error: Your local changes to the following files would be overwritten by merge:',
    ...paths.map((path) => `\t${path}`),
    'Please commit your changes or stash them before you merge.',
    'Aborting',
  ]
}

export function untrackedOverwriteRefusal(paths: readonly string[]): string[] {
  return [
    'error: The following untracked working tree files would be overwritten by merge:',
    ...paths.map((path) => `\t${path}`),
    'Please move or remove them before you merge.',
    'Aborting',
  ]
}

export function lostFoldersRefusal(folders: readonly string[]): string[] {
  return [
    'error: Updating the following directories would lose untracked files in them:',
    ...folders.map((folder) => `\t${folder}`),
    '',
    'Aborting',
  ]
}

function workRefusal(work: DirtyWork, touched: ReadonlySet<string>): string[] | null {
  const dirty = dirtyPathsIn(work, touched)
  if (dirty.length > 0) return overwriteRefusal(dirty)

  const clash = untrackedClashesIn(work, touched)
  if (clash.overwritten.length > 0) return untrackedOverwriteRefusal(clash.overwritten)
  if (clash.lostFolders.length > 0) return lostFoldersRefusal(clash.lostFolders)
  return null
}

export function guardFastForward(work: DirtyWork, touched: ReadonlySet<string>, before: string, after: string): void {
  const refusal = workRefusal(work, touched)
  if (!refusal) return

  throw new SandboxError([`Updating ${shortOid(before)}..${shortOid(after)}`, ...refusal].join('\n'))
}

export function guardTrueMerge(work: DirtyWork, touched: ReadonlySet<string>): void {
  const staged = stagedPaths(work)
  if (staged.length > 0) {
    throw new SandboxError(
      [
        'error: Your local changes to the following files would be overwritten by merge:',
        ...staged.map((path) => `  ${path}`),
        ORT_FAILED,
      ].join('\n'),
    )
  }

  const refusal = workRefusal(work, touched)
  if (refusal) throw new SandboxError([...refusal, ORT_FAILED].join('\n'))
}
