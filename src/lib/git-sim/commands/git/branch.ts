import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { assertNoBranchNameClash } from '@/lib/git-sim/branchNameClash'
import { say } from '@/lib/git-sim/output'
import { currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/repository'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const DELETE_FLAGS = ['-d', '--delete', '-D']

async function listBranches(
  ctx: CommandContext,
  dir: string,
  includeRemotes: boolean,
): Promise<CommandOutput[]> {
  const branch = await currentBranch(ctx, dir)
  const locals = await git.listBranches({ fs: gitFs(ctx.fs), dir })
  const lines = locals.map((name) => (name === branch ? `* ${name}` : `  ${name}`))

  if (includeRemotes) {
    for (const { remote } of await git.listRemotes({ fs: gitFs(ctx.fs), dir })) {
      const names = await git.listBranches({ fs: gitFs(ctx.fs), dir, remote })
      lines.push(...names.map((name) => `  remotes/${remote}/${name}`))
    }
  }

  return say(lines.join('\n'))
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

export const branch: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (hasFlag(args, '-m', '--move')) {
      throw new SandboxError('fatal: git branch -m is not simulated in this course.')
    }

    const deleteTarget = flagValue(args, ...DELETE_FLAGS)
    if (deleteTarget) return deleteBranch(ctx, dir, deleteTarget, hasFlag(args, '-D'))

    const name = operandsOf(args)[0]
    if (!name) return listBranches(ctx, dir, hasFlag(args, '-a', '--all', '-r', '--remotes'))

    if (await refOid(ctx, dir, `refs/heads/${name}`)) {
      throw new SandboxError(`fatal: a branch named '${name}' already exists`)
    }
    await assertNoBranchNameClash(ctx, dir, name)
    if (!(await headOid(ctx, dir))) {
      throw new SandboxError(`fatal: not a valid object name: '${(await currentBranch(ctx, dir)) ?? 'main'}'`)
    }

    await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, checkout: false })
    return []
  },
}
