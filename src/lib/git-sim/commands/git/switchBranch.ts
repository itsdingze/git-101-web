import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { currentBranch, refOid } from '@/lib/git-sim/repository'
import type { CommandContext, CommandOutput } from '@/lib/git-sim/types'

async function branchExists(ctx: CommandContext, dir: string, name: string): Promise<boolean> {
  return (await refOid(ctx, dir, `refs/heads/${name}`)) !== null
}

export async function createAndSwitch(
  ctx: CommandContext,
  dir: string,
  name: string,
): Promise<CommandOutput[]> {
  if (await branchExists(ctx, dir, name)) {
    throw new SandboxError(`fatal: a branch named '${name}' already exists`)
  }

  const previous = await currentBranch(ctx, dir)
  await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, checkout: true })
  ctx.rememberBranch(previous)

  return say(`Switched to a new branch '${name}'`)
}

export async function switchTo(
  ctx: CommandContext,
  dir: string,
  name: string,
): Promise<CommandOutput[]> {
  const target = name === '-' ? ctx.previousBranch : name
  if (!target) throw new SandboxError('fatal: no previous branch to switch to')

  if (!(await branchExists(ctx, dir, target))) {
    throw new SandboxError(`fatal: invalid reference: ${target}`)
  }

  const previous = await currentBranch(ctx, dir)
  if (previous === target) return say(`Already on '${target}'`)

  await git.checkout({ fs: gitFs(ctx.fs), dir, ref: target })
  ctx.rememberBranch(previous)

  return say(`Switched to branch '${target}'`)
}
