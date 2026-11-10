import { joinPath } from '@/lib/git-sim/fs/paths'
import { readText, writeText } from '@/lib/git-sim/fs/fileOperations'
import { rememberConflictText } from './conflictText'
import type { MergeTrees } from './mergeReport'
import type { CommandContext } from '@/lib/git-sim/types'

type MarkerNames = { ours: string; theirs: string }

function markerName(ref: string): string {
  return ref.replace(/^refs\/(heads\/|tags\/|remotes\/)?/, '')
}

function lastLineOf(text: string): string {
  return text.slice(text.lastIndexOf('\n') + 1)
}

function separateAtMarker(text: string, side: string | undefined, marker: string): string {
  if (side === undefined || side === '' || side.endsWith('\n')) return text

  const glued = `${lastLineOf(side)}${marker}`
  const at = text.lastIndexOf(glued)
  if (at === -1) return text
  return `${text.slice(0, at + glued.length - marker.length)}\n${text.slice(at + glued.length - marker.length)}`
}

// git.merge's conflict output joins a marker to a last line that has no final newline.
function markersOnTheirOwnLines(text: string, ours: string | undefined, theirs: string | undefined, theirMarker: string): string {
  if (!text.endsWith('\n')) return text
  return separateAtMarker(separateAtMarker(text, ours, '=======\n'), theirs, theirMarker)
}

// git.merge labels each side with the ref it was given and takes no override for either.
export async function relabelConflictMarkers(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
  given: MarkerNames,
  wanted: MarkerNames,
  trees: MergeTrees,
): Promise<void> {
  const remembered: Record<string, string> = {}
  for (const path of paths) {
    const absolute = joinPath(dir, path)
    const marked = await readText(ctx.fs, absolute)
    const relabelled = marked
      .split(`<<<<<<< ${markerName(given.ours)}\n`)
      .join(`<<<<<<< ${wanted.ours}\n`)
      .split(`>>>>>>> ${markerName(given.theirs)}\n`)
      .join(`>>>>>>> ${wanted.theirs}\n`)
    const onOwnLines = markersOnTheirOwnLines(relabelled, trees.ours.get(path), trees.theirs.get(path), `>>>>>>> ${wanted.theirs}\n`)
    await writeText(ctx.fs, absolute, onOwnLines)
    remembered[path] = onOwnLines
  }
  await rememberConflictText(ctx, dir, remembered)
}
