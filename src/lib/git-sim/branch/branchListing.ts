import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { hasFlag } from '@/lib/git-sim/input/parseArgs'
import { say, silent } from '@/lib/git-sim/output'
import { currentBranch, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { compareWithRemote } from '@/lib/git-sim/remote/branchTracking'
import { readUpstream, remoteRefOf } from '@/lib/git-sim/remote/upstream'
import type { CommandContext, CommandOutput } from '@/lib/git-sim/types'

type BranchRow = {
  marker: string
  name: string
  ref: string
  local: boolean
}

async function localRows(ctx: CommandContext, dir: string): Promise<BranchRow[]> {
  const checkedOut = await currentBranch(ctx, dir)
  const names = await git.listBranches({ fs: gitFs(ctx.fs), dir })
  return names.map((name) => ({ marker: name === checkedOut ? '*' : ' ', name, ref: `refs/heads/${name}`, local: true }))
}

async function remoteRows(ctx: CommandContext, dir: string, label: (remoteRef: string) => string): Promise<BranchRow[]> {
  const rows: BranchRow[] = []
  for (const { remote } of await git.listRemotes({ fs: gitFs(ctx.fs), dir })) {
    for (const name of await git.listBranches({ fs: gitFs(ctx.fs), dir, remote })) {
      const remoteRef = `${remote}/${name}`
      rows.push({ marker: ' ', name: label(remoteRef), ref: `refs/remotes/${remoteRef}`, local: false })
    }
  }
  return rows
}

async function listedRows(ctx: CommandContext, dir: string, args: readonly string[]): Promise<BranchRow[]> {
  if (hasFlag(args, '-r', '--remotes')) return remoteRows(ctx, dir, (remoteRef) => remoteRef)
  const locals = await localRows(ctx, dir)
  if (!hasFlag(args, '-a', '--all')) return locals
  return [...locals, ...(await remoteRows(ctx, dir, (remoteRef) => `remotes/${remoteRef}`))]
}

function verbosity(args: readonly string[]): number {
  return args.reduce((level, arg) => {
    if (arg === '--verbose') return level + 1
    return /^-[A-Za-z]+$/.test(arg) ? level + [...arg].filter((letter) => letter === 'v').length : level
  }, 0)
}

async function trackingLabel(ctx: CommandContext, dir: string, branch: string, namesUpstream: boolean): Promise<string> {
  const upstream = await readUpstream(ctx, dir, branch)
  if (!upstream) return ''

  const remoteRef = remoteRefOf(upstream)
  const tracking = await compareWithRemote(ctx, dir, branch, remoteRef)
  const counts = tracking
    ? [
        ...(tracking.ahead > 0 ? [`ahead ${tracking.ahead}`] : []),
        ...(tracking.behind > 0 ? [`behind ${tracking.behind}`] : []),
      ].join(', ')
    : 'gone'

  if (namesUpstream) return counts ? `[${remoteRef}: ${counts}] ` : `[${remoteRef}] `
  return counts ? `[${counts}] ` : ''
}

async function verboseLine(
  ctx: CommandContext,
  dir: string,
  row: BranchRow,
  width: number,
  namesUpstream: boolean,
): Promise<string> {
  const oid = (await refOid(ctx, dir, row.ref)) ?? ''
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
  const tracking = row.local ? await trackingLabel(ctx, dir, row.name, namesUpstream) : ''
  return `${row.marker} ${row.name.padEnd(width)} ${shortOid(oid)} ${tracking}${commitSubject(commit.message)}`
}

export async function listBranches(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
): Promise<CommandOutput[]> {
  const rows = await listedRows(ctx, dir, args)
  const level = verbosity(args)
  if (rows.length === 0) return silent
  if (level === 0) return say(rows.map((row) => `${row.marker} ${row.name}`).join('\n'))

  const width = Math.max(0, ...rows.map((row) => row.name.length))
  const lines: string[] = []
  for (const row of rows) lines.push(await verboseLine(ctx, dir, row, width, level > 1))
  return say(lines.join('\n'))
}
