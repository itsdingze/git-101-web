import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, readText, removeTree, writeText } from '@/lib/git-sim/fs/fileOperations'
import { commitSignature } from '@/lib/git-sim/history/repository'
import type { CommandContext } from '@/lib/git-sim/types'

export const STASH_REF = 'refs/stash'
const ZERO_OID = '0'.repeat(40)

function stashLogPath(dir: string): string {
  return joinPath(dir, '.git/logs/refs/stash')
}

export function entryOid(line: string): string {
  return line.split(' ')[1] ?? ''
}

export function entryMessage(line: string): string {
  return line.split('\t')[1] ?? ''
}

export async function readStashLog(ctx: CommandContext, dir: string): Promise<string[]> {
  const path = stashLogPath(dir)
  if (!(await pathExists(ctx.fs, path))) return []
  return (await readText(ctx.fs, path)).split('\n').filter(Boolean)
}

export async function writeStashLog(ctx: CommandContext, dir: string, lines: readonly string[]): Promise<void> {
  const newest = lines[lines.length - 1]
  if (!newest) {
    await removeTree(ctx.fs, stashLogPath(dir))
    await git.deleteRef({ fs: gitFs(ctx.fs), dir, ref: STASH_REF })
    return
  }

  await writeText(ctx.fs, stashLogPath(dir), `${lines.join('\n')}\n`)
  await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: STASH_REF, value: entryOid(newest), force: true })
}

export async function recordStashEntry(ctx: CommandContext, dir: string, oid: string, message: string): Promise<void> {
  const author = await commitSignature(ctx, dir)
  const who = `${author.name} <${author.email}> ${author.timestamp} +0000`
  const line = `${ZERO_OID} ${oid} ${who}\t${message}`
  await writeStashLog(ctx, dir, [...(await readStashLog(ctx, dir)), line])
}
