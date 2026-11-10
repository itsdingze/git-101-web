import git from 'isomorphic-git'
import { fileHunks } from './boundedDiff'

const NULL_OID = '0000000'
const FUNCTION_LINE = /^[A-Za-z_$]/
const FUNCTION_CONTEXT_WIDTH = 80
const DEFAULT_CONTEXT = 3

export async function blobHash(text: string | undefined): Promise<string> {
  if (text === undefined) return NULL_OID
  const { oid } = await git.hashBlob({ object: new TextEncoder().encode(text) })
  return oid.slice(0, 7)
}

function hunkRange(start: number, count: number): string {
  if (count === 0) return `${Math.max(start - 1, 0)},0`
  return count === 1 ? `${start}` : `${start},${count}`
}

function functionContext(oldLines: readonly string[], oldStart: number): string {
  for (let index = oldStart - 2; index >= 0; index -= 1) {
    const line = oldLines[index] ?? ''
    if (FUNCTION_LINE.test(line)) return ` ${line.slice(0, FUNCTION_CONTEXT_WIDTH).trimEnd()}`
  }
  return ''
}

function hunkLines(before: string, after: string, path: string, context: number): string[] {
  const oldLines = before.split('\n')
  return fileHunks(path, before, after, context).flatMap((hunk) => [
    `@@ -${hunkRange(hunk.oldStart, hunk.oldLines)} +${hunkRange(hunk.newStart, hunk.newLines)} @@${functionContext(oldLines, hunk.oldStart)}`,
    ...hunk.lines,
  ])
}

export async function formatFileDiff(
  path: string,
  before: string | undefined,
  after: string | undefined,
  context = DEFAULT_CONTEXT,
): Promise<string> {
  if (before === after) return ''

  const header = [`diff --git a/${path} b/${path}`]
  if (before === undefined) header.push('new file mode 100644')
  if (after === undefined) header.push('deleted file mode 100644')

  const oldHash = await blobHash(before)
  const newHash = await blobHash(after)
  const mode = before === undefined || after === undefined ? '' : ' 100644'
  header.push(`index ${oldHash}..${newHash}${mode}`)
  header.push(before === undefined ? '--- /dev/null' : `--- a/${path}`)
  header.push(after === undefined ? '+++ /dev/null' : `+++ b/${path}`)

  return [...header, ...hunkLines(before ?? '', after ?? '', path, context)].join('\n')
}
