import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { assertNoBranchNameClash } from '@/lib/git-sim/branch/branchNameClash'
import { listBranches } from '@/lib/git-sim/branch/branchListing'
import { say, stderr } from '@/lib/git-sim/output'
import { currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const DELETE_FLAGS = ['-d', '--delete', '-D']

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

async function isMerged(ctx: CommandContext, dir: string, oid: string): Promise<boolean> {
  const head = await headOid(ctx, dir)
  if (!head) return false
  if (head === oid) return true
  return git.isDescendent({ fs: gitFs(ctx.fs), dir, oid: head, ancestor: oid, depth: -1 })
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
  if (!force && !(await isMerged(ctx, dir, oid))) {
    throw new SandboxError(
      [
        `error: The branch '${name}' is not fully merged.`,
        `If you are sure you want to delete it, run 'git branch -D ${name}'.`,
      ].join('\n'),
    )
  }

  await git.deleteBranch({ fs: gitFs(ctx.fs), dir, ref: name })
  return say(`Deleted branch ${name} (was ${shortOid(oid)}).`)
}

async function deleteBranches(
  ctx: CommandContext,
  dir: string,
  names: readonly string[],
  force: boolean,
): Promise<CommandOutput[]> {
  const outputs: CommandOutput[] = []
  for (const name of names) {
    try {
      outputs.push(...(await deleteBranch(ctx, dir, name, force)))
    } catch (error) {
      if (!(error instanceof SandboxError)) throw error
      outputs.push(stderr(error.message))
    }
  }
  return outputs
}

export const branch: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (hasFlag(args, '-m', '--move')) {
      throw new SandboxError("fatal: this course doesn't simulate git branch -m.")
    }

    const deleteTarget = flagValue(args, ...DELETE_FLAGS)
    if (deleteTarget) {
      return deleteBranches(ctx, dir, [deleteTarget, ...operandsOf(args, DELETE_FLAGS)], hasFlag(args, '-D'))
    }
    if (hasFlag(args, ...DELETE_FLAGS)) throw new SandboxError('fatal: branch name required')

    const [name, startPoint] = operandsOf(args)
    if (!name) return listBranches(ctx, dir, args)

    if (await refOid(ctx, dir, `refs/heads/${name}`)) {
      throw new SandboxError(`fatal: a branch named '${name}' already exists`)
    }
    await assertNoBranchNameClash(ctx, dir, name)

    const object = await startPointOid(ctx, dir, startPoint)
    await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, object, checkout: false })
    return []
  },
}
