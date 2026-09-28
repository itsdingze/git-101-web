import { structuredPatch } from 'diff'
import git from 'isomorphic-git'
import type { CommandContext } from './types'

const NULL_OID = '0000000'

async function shortHash(ctx: CommandContext, text: string | undefined): Promise<string> {
  if (text === undefined) return NULL_OID
  const { oid } = await git.hashBlob({ object: new TextEncoder().encode(text) })
  return oid.slice(0, 7)
}

function hunkRange(start: number, count: number): string {
  if (count === 0) return `${Math.max(start - 1, 0)},0`
  return count === 1 ? `${start}` : `${start},${count}`
}

function hunkLines(before: string, after: string, path: string): string[] {
  const patch = structuredPatch(path, path, before, after, '', '', { context: 3 })
  return patch.hunks.flatMap((hunk) => [
    `@@ -${hunkRange(hunk.oldStart, hunk.oldLines)} +${hunkRange(hunk.newStart, hunk.newLines)} @@`,
    ...hunk.lines,
  ])
}

export async function formatFileDiff(
  ctx: CommandContext,
  path: string,
  before: string | undefined,
  after: string | undefined,
): Promise<string> {
  if (before === after) return ''

  const header = [`diff --git a/${path} b/${path}`]
  if (before === undefined) header.push('new file mode 100644')
  if (after === undefined) header.push('deleted file mode 100644')

  const oldHash = await shortHash(ctx, before)
  const newHash = await shortHash(ctx, after)
  const mode = before === undefined || after === undefined ? '' : ' 100644'
  header.push(`index ${oldHash}..${newHash}${mode}`)
  header.push(before === undefined ? '--- /dev/null' : `--- a/${path}`)
  header.push(after === undefined ? '+++ /dev/null' : `+++ b/${path}`)

  return [...header, ...hunkLines(before ?? '', after ?? '', path)].join('\n')
}

export async function formatTreeDiff(
  ctx: CommandContext,
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
): Promise<string> {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort()
  const patches: string[] = []

  for (const path of paths) {
    const patch = await formatFileDiff(ctx, path, before.get(path), after.get(path))
    if (patch) patches.push(patch)
  }

  return patches.join('\n')
}
