import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { placeFile } from '@/lib/git-sim/fs/pathBlockers'
import { changedPaths } from './dirtyWork'
import type { CommandContext } from '@/lib/git-sim/types'

export async function stageTreeChanges(
  ctx: CommandContext,
  dir: string,
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
  inScope: (path: string) => boolean = () => true,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  for (const path of changedPaths(before, after)) {
    if (!inScope(path)) continue
    const contents = after.get(path)
    await placeFile(ctx, dir, path, contents)
    if (contents === undefined) await git.remove({ fs, dir, filepath: path })
    else await git.add({ fs, dir, filepath: path, force: true })
  }
}
