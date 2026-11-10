import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, readText, writeText } from '@/lib/git-sim/fs/fileOperations'
import type { CommandContext } from '@/lib/git-sim/types'

export const CONFLICT_TEXT_RECORD = '.git/CONFLICT_TEXT'

function isTextRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && Object.values(value).every((text) => typeof text === 'string')
}

async function readRecord(ctx: CommandContext, dir: string): Promise<Record<string, string>> {
  const path = joinPath(dir, CONFLICT_TEXT_RECORD)
  if (!(await pathExists(ctx.fs, path))) return {}
  const stored: unknown = JSON.parse(await readText(ctx.fs, path))
  return isTextRecord(stored) ? stored : {}
}

export async function rememberConflictText(ctx: CommandContext, dir: string, texts: Readonly<Record<string, string>>): Promise<void> {
  await writeText(ctx.fs, joinPath(dir, CONFLICT_TEXT_RECORD), JSON.stringify({ ...(await readRecord(ctx, dir)), ...texts }))
}

export async function remainingConflictText(ctx: CommandContext, dir: string, path: string): Promise<string | undefined> {
  return (await readRecord(ctx, dir))[path]
}

export function genericConflictMarkers(marked: string): string {
  return marked.replace(/^<{7} .*$/gm, '<<<<<<< ours').replace(/^>{7} .*$/gm, '>>>>>>> theirs')
}
