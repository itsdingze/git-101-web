import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { silent } from '@/lib/git-sim/output'
import { currentBranch, refOid } from '@/lib/git-sim/history/repository'
import { clearUpstream, readUpstream, setUpstream } from '@/lib/git-sim/remote/upstream'
import { assertValidNewBranchName } from './branchNameRules'
import type { CommandContext, CommandOutput } from '@/lib/git-sim/types'

type NamePair = { from: string; to: string; current: string | null }

async function namePair(ctx: CommandContext, dir: string, operands: readonly string[]): Promise<NamePair> {
  const [first, second, extra] = operands
  if (extra !== undefined) throw new SandboxError('fatal: too many arguments for a rename operation')
  if (first === undefined) throw new SandboxError('fatal: branch name required')

  const current = await currentBranch(ctx, dir)
  if (second !== undefined) return { from: first, to: second, current }
  if (!current) throw new SandboxError('fatal: cannot rename the current branch while not on any')
  return { from: current, to: first, current }
}

async function refuseOverwrite(ctx: CommandContext, dir: string, { to, current }: NamePair, force: boolean): Promise<void> {
  if (!(await refOid(ctx, dir, `refs/heads/${to}`))) return
  if (!force) throw new SandboxError(`fatal: a branch named '${to}' already exists`)
  if (to === current) throw new SandboxError(`fatal: cannot force update the branch '${to}' used by worktree at '${dir}'`)
}

async function discardTarget(ctx: CommandContext, dir: string, to: string): Promise<void> {
  if (!(await refOid(ctx, dir, `refs/heads/${to}`))) return
  await git.deleteBranch({ fs: gitFs(ctx.fs), dir, ref: to })
  await clearUpstream(ctx, dir, to)
}

async function copyUpstream(ctx: CommandContext, dir: string, from: string, to: string): Promise<void> {
  const upstream = await readUpstream(ctx, dir, from)
  if (upstream) await setUpstream(ctx, dir, to, upstream)
}

export async function renameBranch(
  ctx: CommandContext,
  dir: string,
  operands: readonly string[],
  force: boolean,
): Promise<CommandOutput[]> {
  const pair = await namePair(ctx, dir, operands)
  const { from, to, current } = pair
  assertValidNewBranchName(to)

  const fromOid = await refOid(ctx, dir, `refs/heads/${from}`)
  if (!fromOid && from !== current) throw new SandboxError(`fatal: no branch named '${from}'`)
  if (from === to) return silent

  await refuseOverwrite(ctx, dir, pair, force)
  await discardTarget(ctx, dir, to)

  const fs = gitFs(ctx.fs)
  if (fromOid) await git.renameBranch({ fs, dir, oldref: from, ref: to })
  else await git.writeRef({ fs, dir, ref: 'HEAD', value: `refs/heads/${to}`, symbolic: true, force: true })

  await copyUpstream(ctx, dir, from, to)
  await clearUpstream(ctx, dir, from)
  return silent
}

export async function copyBranch(
  ctx: CommandContext,
  dir: string,
  operands: readonly string[],
  force: boolean,
): Promise<CommandOutput[]> {
  const pair = await namePair(ctx, dir, operands)
  const { from, to } = pair
  assertValidNewBranchName(to)

  const fromOid = await refOid(ctx, dir, `refs/heads/${from}`)
  if (!fromOid) throw new SandboxError(`fatal: no branch named '${from}'`)
  if (from === to) return silent

  await refuseOverwrite(ctx, dir, pair, force)
  await discardTarget(ctx, dir, to)
  await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: `refs/heads/${to}`, value: fromOid, force: true })
  await copyUpstream(ctx, dir, from, to)
  return silent
}
