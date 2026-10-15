import { joinPath } from '@/lib/git-sim/fs/paths'
import { readText, writeText } from '@/lib/git-sim/fs/fileOperations'
import type { CommandContext } from '@/lib/git-sim/types'

type MarkerNames = { ours: string; theirs: string }

function markerName(ref: string): string {
  return ref.replace(/^refs\/(heads\/|tags\/|remotes\/)?/, '')
}

// git.merge labels each side with the ref it was given and takes no override for either.
export async function relabelConflictMarkers(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
  given: MarkerNames,
  wanted: MarkerNames,
): Promise<void> {
  for (const path of paths) {
    const absolute = joinPath(dir, path)
    const marked = await readText(ctx.fs, absolute)
    const relabelled = marked
      .split(`<<<<<<< ${markerName(given.ours)}\n`)
      .join(`<<<<<<< ${wanted.ours}\n`)
      .split(`>>>>>>> ${markerName(given.theirs)}\n`)
      .join(`>>>>>>> ${wanted.theirs}\n`)
    await writeText(ctx.fs, absolute, relabelled)
  }
}
