import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, readText, writeText } from '@/lib/git-sim/fs/fileOperations'
import { headOid } from './repository'
import type { CommandContext } from '@/lib/git-sim/types'

function historyPath(dir: string): string {
  return joinPath(dir, '.git/logs/HEAD')
}

export async function readHeadHistory(ctx: CommandContext, dir: string): Promise<string[]> {
  const path = historyPath(dir)
  if (!(await pathExists(ctx.fs, path))) return []
  return (await readText(ctx.fs, path)).split('\n').filter(Boolean)
}

export async function recordHeadMove(ctx: CommandContext, dir: string): Promise<void> {
  const oid = await headOid(ctx, dir)
  if (!oid) return

  const oids = [...(await readHeadHistory(ctx, dir)), oid]
  await writeText(ctx.fs, historyPath(dir), `${oids.join('\n')}\n`)
}
