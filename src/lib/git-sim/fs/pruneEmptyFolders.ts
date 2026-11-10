import { joinPath } from './paths'
import { isDirectory } from './fileOperations'
import type { CommandContext } from '@/lib/git-sim/types'

export async function pruneEmptyFolders(ctx: CommandContext, dir: string, path: string): Promise<void> {
  const parts = path.split('/').slice(0, -1)
  for (let depth = parts.length; depth > 0; depth -= 1) {
    const folder = joinPath(dir, parts.slice(0, depth).join('/'))
    if (!(await isDirectory(ctx.fs, folder))) return
    if ((await ctx.fs.promises.readdir(folder)).length > 0) return
    await ctx.fs.promises.rmdir(folder)
  }
}
