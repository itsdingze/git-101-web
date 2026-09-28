import { joinPath } from './paths'
import { pathExists, readText, writeText } from './fileOperations'
import { headOid } from './repository'
import type { CommandContext } from './types'

export type HeadMove = {
  oid: string
  description: string
}

function historyPath(dir: string): string {
  return joinPath(dir, '.git/logs/HEAD')
}

async function readLines(ctx: CommandContext, dir: string): Promise<string[]> {
  const path = historyPath(dir)
  if (!(await pathExists(ctx.fs, path))) return []
  return (await readText(ctx.fs, path)).split('\n').filter(Boolean)
}

export async function recordHeadMove(
  ctx: CommandContext,
  dir: string,
  description: string,
): Promise<void> {
  const oid = await headOid(ctx, dir)
  if (!oid) return

  const lines = [...(await readLines(ctx, dir)), `${oid}\t${description}`]
  await writeText(ctx.fs, historyPath(dir), `${lines.join('\n')}\n`)
}

export async function readHeadHistory(ctx: CommandContext, dir: string): Promise<HeadMove[]> {
  const lines = await readLines(ctx, dir)
  return lines.map((line) => {
    const [oid = '', description = ''] = line.split('\t')
    return { oid, description }
  })
}
