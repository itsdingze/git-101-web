import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandContext } from '@/lib/git-sim/types'

export async function initRepository(ctx: CommandContext, dir: string, initialBranch = 'main'): Promise<void> {
  const fs = gitFs(ctx.fs)
  await git.init({ fs, dir, defaultBranch: initialBranch })
  await git.setConfig({ fs, dir, path: 'core.filemode', value: true })
  await git.setConfig({ fs, dir, path: 'core.symlinks', value: undefined })
  await git.setConfig({ fs, dir, path: 'core.ignorecase', value: undefined })
}
