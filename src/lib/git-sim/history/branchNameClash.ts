import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import type { CommandContext } from '@/lib/git-sim/types'

function clashingBranch(name: string, existing: readonly string[]): string | undefined {
  return existing.find((branch) => branch.startsWith(`${name}/`) || name.startsWith(`${branch}/`))
}

export async function assertNoBranchNameClash(
  ctx: CommandContext,
  dir: string,
  name: string,
): Promise<void> {
  const clash = clashingBranch(name, await git.listBranches({ fs: gitFs(ctx.fs), dir }))
  if (!clash) return

  throw new SandboxError(
    `fatal: cannot lock ref 'refs/heads/${name}': 'refs/heads/${clash}' exists; cannot create 'refs/heads/${name}'`,
  )
}
