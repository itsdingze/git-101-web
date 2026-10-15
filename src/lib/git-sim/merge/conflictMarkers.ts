import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { isDirectory, readText } from '@/lib/git-sim/fs/fileOperations'
import { joinPath } from '@/lib/git-sim/fs/paths'
import type { CommandContext } from '@/lib/git-sim/types'

const MARKER_LINE = /^(<{7} .*|={7}|>{7} .*)$/m

function hasConflictMarkers(text: string): boolean {
  return MARKER_LINE.test(text)
}

export async function filesWithMarkers(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<string[]> {
  const marked: string[] = []
  for (const path of paths) {
    const absolute = joinPath(dir, path)
    if (await isDirectory(ctx.fs, absolute)) continue
    if (hasConflictMarkers(await readText(ctx.fs, absolute))) marked.push(path)
  }
  return marked
}

export async function headHasMarkers(ctx: CommandContext, dir: string, head: string): Promise<boolean> {
  const fs = gitFs(ctx.fs)
  for (const filepath of await git.listFiles({ fs, dir, ref: head })) {
    const { blob } = await git.readBlob({ fs, dir, oid: head, filepath })
    if (hasConflictMarkers(new TextDecoder().decode(blob))) return true
  }
  return false
}
