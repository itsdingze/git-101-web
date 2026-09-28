import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { assertNoBranchNameClash } from '@/lib/git-sim/branchNameClash'
import { say } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/headHistory'
import { currentBranch, refOid, shortOid } from '@/lib/git-sim/repository'
import { resolveCommitish } from '@/lib/git-sim/resolveCommitish'
import type { CommandContext, CommandOutput } from '@/lib/git-sim/types'

export function detachedHead(spec: string, oid: string): string {
  return [
    `fatal: checking out ${shortOid(oid)} would detach HEAD, which is not simulated in this course.`,
    `hint: name the commit instead: git switch -c <new-branch> ${spec}`,
  ].join('\n')
}

async function branchExists(ctx: CommandContext, dir: string, name: string): Promise<boolean> {
  return (await refOid(ctx, dir, `refs/heads/${name}`)) !== null
}

async function refuseNonBranch(ctx: CommandContext, dir: string, spec: string): Promise<never> {
  const commit = await resolveCommitish(ctx, dir, spec)
  throw new SandboxError(commit ? detachedHead(spec, commit) : `fatal: invalid reference: ${spec}`)
}

async function startPointOid(ctx: CommandContext, dir: string, spec: string): Promise<string> {
  const oid = await resolveCommitish(ctx, dir, spec)
  if (!oid) throw new SandboxError(`fatal: invalid reference: ${spec}`)
  return oid
}

async function createAt(
  ctx: CommandContext,
  dir: string,
  name: string,
  object: string,
): Promise<void> {
  await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, object })
  try {
    await git.checkout({ fs: gitFs(ctx.fs), dir, ref: name })
  } catch (error) {
    await git.deleteBranch({ fs: gitFs(ctx.fs), dir, ref: name })
    throw error
  }
}

async function noteMove(
  ctx: CommandContext,
  dir: string,
  from: string | null,
  to: string,
): Promise<void> {
  await recordHeadMove(ctx, dir, `checkout: moving from ${from ?? 'HEAD'} to ${to}`)
}

export async function createAndSwitch(
  ctx: CommandContext,
  dir: string,
  name: string,
  startPoint?: string,
): Promise<CommandOutput[]> {
  if (await branchExists(ctx, dir, name)) {
    throw new SandboxError(`fatal: a branch named '${name}' already exists`)
  }
  await assertNoBranchNameClash(ctx, dir, name)

  const previous = await currentBranch(ctx, dir)
  if (startPoint) await createAt(ctx, dir, name, await startPointOid(ctx, dir, startPoint))
  else await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, checkout: true })

  ctx.rememberBranch(previous)
  await noteMove(ctx, dir, previous, name)

  return say(`Switched to a new branch '${name}'`)
}

export async function switchTo(
  ctx: CommandContext,
  dir: string,
  name: string,
): Promise<CommandOutput[]> {
  const target = name === '-' ? ctx.previousBranch : name
  if (!target) throw new SandboxError('fatal: no previous branch to switch to')

  if (!(await branchExists(ctx, dir, target))) await refuseNonBranch(ctx, dir, target)

  const previous = await currentBranch(ctx, dir)
  if (previous === target) return say(`Already on '${target}'`)

  await git.checkout({ fs: gitFs(ctx.fs), dir, ref: target })
  ctx.rememberBranch(previous)
  await noteMove(ctx, dir, previous, target)

  return say(`Switched to branch '${target}'`)
}
