import { joinPath } from './paths'
import { isDirectory, pathExists, removeTree, writeText } from './fileOperations'
import type { CommandContext } from '@/lib/git-sim/types'

async function clearBlockingAncestors(ctx: CommandContext, dir: string, path: string): Promise<void> {
  const parts = path.split('/')
  for (let depth = 1; depth < parts.length; depth += 1) {
    const absolute = joinPath(dir, parts.slice(0, depth).join('/'))
    if (!(await pathExists(ctx.fs, absolute))) return
    if (!(await isDirectory(ctx.fs, absolute))) {
      await removeTree(ctx.fs, absolute)
      return
    }
  }
}

export async function placeFile(ctx: CommandContext, dir: string, path: string, contents: string | undefined): Promise<void> {
  const absolute = joinPath(dir, path)
  if (contents === undefined) {
    if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
    return
  }
  await clearBlockingAncestors(ctx, dir, path)
  if (await isDirectory(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
  await writeText(ctx.fs, absolute, contents)
}

export async function clearCheckoutBlockers(ctx: CommandContext, dir: string, paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    await clearBlockingAncestors(ctx, dir, path)
    const absolute = joinPath(dir, path)
    if (await isDirectory(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
  }
}
