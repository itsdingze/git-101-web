import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandLine, KnownOptions } from '@/lib/git-sim/input/commandLine'
import { SandboxError } from '@/lib/git-sim/errors'
import { assertNoBranchNameClash } from '@/lib/git-sim/branch/branchNameClash'
import { assertValidNewBranchName } from '@/lib/git-sim/branch/branchNameRules'
import { listBranches } from '@/lib/git-sim/branch/branchListing'
import { copyBranch, renameBranch } from '@/lib/git-sim/branch/renameBranch'
import { setBranchUpstream, unsetBranchUpstream } from '@/lib/git-sim/branch/branchUpstream'
import { say, silent, stderr, stdout } from '@/lib/git-sim/output'
import { isAncestor } from '@/lib/git-sim/history/ancestry'
import { currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { readUpstream, remoteBranchNamed, remoteRefOf, setUpstream, trackingRefOf } from '@/lib/git-sim/remote/upstream'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const DELETE_FLAGS = ['-d', '--delete', '-D']
const RENAME_FLAGS = ['-m', '--move', '-M']
const COPY_FLAGS = ['-c', '--copy', '-C']
const UPSTREAM_FLAGS = ['-u', '--set-upstream-to']
const LIST_FLAGS = ['-l', '--list']
const REVISION_FILTERS = ['--contains', '--merged', '--no-merged']

const BRANCH_OPTIONS: KnownOptions = {
  flags: [
    ...DELETE_FLAGS,
    ...RENAME_FLAGS,
    ...COPY_FLAGS,
    ...LIST_FLAGS,
    '-r',
    '--remotes',
    '-a',
    '--all',
    '-v',
    '--verbose',
    '--show-current',
    '--unset-upstream',
  ],
  valueFlags: UPSTREAM_FLAGS,
  trailingValueFlags: REVISION_FILTERS,
}

async function startPointOid(
  ctx: CommandContext,
  dir: string,
  startPoint: string | undefined,
): Promise<string> {
  const name = startPoint ?? (await currentBranch(ctx, dir)) ?? 'main'
  const oid = startPoint ? await resolveCommitish(ctx, dir, startPoint) : await headOid(ctx, dir)
  if (!oid) throw new SandboxError(`fatal: not a valid object name: '${name}'`)
  return oid
}

type MergeCheck = { merged: boolean; warning: string | null }

async function checkMerged(ctx: CommandContext, dir: string, name: string, oid: string): Promise<MergeCheck> {
  const head = await headOid(ctx, dir)
  const upstream = await readUpstream(ctx, dir, name)
  const upstreamRef = upstream ? trackingRefOf(upstream) : null
  const upstreamOid = upstreamRef ? await refOid(ctx, dir, upstreamRef) : null
  const reference = upstreamOid ?? head

  const merged = reference ? await isAncestor(ctx, dir, oid, reference) : false
  if (!upstreamOid || !upstreamRef || upstreamOid === head) return { merged, warning: null }

  const mergedToHead = head ? await isAncestor(ctx, dir, oid, head) : false
  if (mergedToHead === merged) return { merged, warning: null }
  return {
    merged,
    warning: merged
      ? `warning: deleting branch '${name}' that has been merged to\n         '${upstreamRef}', but not yet merged to HEAD`
      : `warning: not deleting branch '${name}' that is not yet merged to\n         '${upstreamRef}', even though it is merged to HEAD`,
  }
}

async function deleteBranch(
  ctx: CommandContext,
  dir: string,
  name: string,
  force: boolean,
): Promise<CommandOutput[]> {
  const oid = await refOid(ctx, dir, `refs/heads/${name}`)
  if (!oid) throw new SandboxError(`error: branch '${name}' not found.`)

  if (name === (await currentBranch(ctx, dir))) {
    throw new SandboxError(`error: Cannot delete branch '${name}' checked out at '${dir}'`)
  }

  const { merged, warning } = force ? { merged: true, warning: null } : await checkMerged(ctx, dir, name, oid)
  if (!merged) {
    throw new SandboxError(
      [
        ...(warning ? [warning] : []),
        `error: The branch '${name}' is not fully merged.`,
        `If you are sure you want to delete it, run 'git branch -D ${name}'.`,
      ].join('\n'),
    )
  }

  await git.deleteBranch({ fs: gitFs(ctx.fs), dir, ref: name })
  return [...(warning ? [stdout(warning)] : []), stdout(`Deleted branch ${name} (was ${shortOid(oid)}).`)]
}

async function deleteRemoteTracking(ctx: CommandContext, dir: string, name: string): Promise<CommandOutput[]> {
  const ref = `refs/remotes/${name}`
  const oid = await refOid(ctx, dir, ref)
  if (!oid) throw new SandboxError(`error: remote-tracking branch '${name}' not found`)

  await git.deleteRef({ fs: gitFs(ctx.fs), dir, ref })
  return say(`Deleted remote-tracking branch ${name} (was ${shortOid(oid)}).`)
}

async function deleteBranches(
  names: readonly string[],
  deleteOne: (name: string) => Promise<CommandOutput[]>,
): Promise<CommandOutput[]> {
  const outputs: CommandOutput[] = []
  for (const name of names) {
    try {
      outputs.push(...(await deleteOne(name)))
    } catch (error) {
      if (!(error instanceof SandboxError)) throw error
      outputs.push(stderr(error.message))
    }
  }
  return outputs
}

async function createBranch(
  ctx: CommandContext,
  dir: string,
  name: string,
  startPoint: string | undefined,
): Promise<CommandOutput[]> {
  assertValidNewBranchName(name)
  if (await refOid(ctx, dir, `refs/heads/${name}`)) {
    throw new SandboxError(`fatal: a branch named '${name}' already exists`)
  }
  await assertNoBranchNameClash(ctx, dir, name)

  const object = await startPointOid(ctx, dir, startPoint)
  await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, object, checkout: false })

  const tracked = startPoint ? await remoteBranchNamed(ctx, dir, startPoint) : null
  if (!tracked) return silent

  await setUpstream(ctx, dir, name, tracked)
  return say(`branch '${name}' set up to track '${remoteRefOf(tracked)}'.`)
}

async function showCurrent(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const name = await currentBranch(ctx, dir)
  return name ? say(name) : silent
}

function isListing(line: CommandLine): boolean {
  return line.operands.length === 0 || line.has(...LIST_FLAGS, ...REVISION_FILTERS)
}

export const branch: GitSubcommand = {
  requiresRepo: true,
  options: BRANCH_OPTIONS,
  run: async (line, ctx, dir) => {
    if (line.has(...DELETE_FLAGS)) {
      if (line.operands.length === 0) throw new SandboxError('fatal: branch name required')
      const force = line.has('-D')
      const deleteOne = line.has('-r', '--remotes')
        ? (name: string) => deleteRemoteTracking(ctx, dir, name)
        : (name: string) => deleteBranch(ctx, dir, name, force)
      return deleteBranches(line.operands, deleteOne)
    }
    if (line.has(...RENAME_FLAGS)) return renameBranch(ctx, dir, line.operands, line.has('-M'))
    if (line.has(...COPY_FLAGS)) return copyBranch(ctx, dir, line.operands, line.has('-C'))
    if (line.has('--unset-upstream')) return unsetBranchUpstream(ctx, dir, line.operands[0])

    const upstream = line.value(...UPSTREAM_FLAGS)
    if (upstream) return setBranchUpstream(ctx, dir, upstream, line.operands[0])
    if (line.has('--show-current')) return showCurrent(ctx, dir)
    if (isListing(line)) return listBranches(ctx, dir, line)

    return createBranch(ctx, dir, line.operands[0] ?? '', line.operands[1])
  },
}
