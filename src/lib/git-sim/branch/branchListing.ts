import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { isAncestor } from '@/lib/git-sim/history/ancestry'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
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

async function selectedRows(ctx: CommandContext, dir: string, line: CommandLine): Promise<BranchRow[]> {
  if (line.has('-r', '--remotes')) return remoteRows(ctx, dir, (remoteRef) => remoteRef)
  const locals = await localRows(ctx, dir)
  if (!line.has('-a', '--all')) return locals
  return [...locals, ...(await remoteRows(ctx, dir, (remoteRef) => `remotes/${remoteRef}`))]
}

type RevisionFilter = { option: string; oid: string }

async function revisionFilters(ctx: CommandContext, dir: string, line: CommandLine): Promise<RevisionFilter[]> {
  const filters: RevisionFilter[] = []
  for (const option of ['--contains', '--merged', '--no-merged']) {
    if (!line.has(option)) continue
    const spec = line.value(option) ?? 'HEAD'
    const oid = await resolveCommitish(ctx, dir, spec)
    if (!oid) throw new SandboxError(`error: malformed object name ${spec}`)
    filters.push({ option, oid })
  }
  return filters
}

async function passesFilter(ctx: CommandContext, dir: string, tip: string, { option, oid }: RevisionFilter): Promise<boolean> {
  if (option === '--contains') return isAncestor(ctx, dir, oid, tip)
  const merged = await isAncestor(ctx, dir, tip, oid)
  return option === '--merged' ? merged : !merged
}

async function rowsPassing(
  ctx: CommandContext,
  dir: string,
  rows: readonly BranchRow[],
  filters: readonly RevisionFilter[],
): Promise<BranchRow[]> {
  const kept: BranchRow[] = []
  for (const row of rows) {
    const tip = await refOid(ctx, dir, row.ref)
    if (!tip) continue
    let passes = true
    for (const filter of filters) passes &&= await passesFilter(ctx, dir, tip, filter)
    if (passes) kept.push(row)
  }
  return kept
}

function wildcardPattern(pattern: string): RegExp {
  const source = [...pattern]
    .map((character) => {
      if (character === '*') return '.*'
      if (character === '?') return '.'
      return character.replace(/[.+^${}()|[\]\\/]/g, '\\$&')
    })
    .join('')
  return new RegExp(`^${source}$`)
}

function matchesAnyPattern(name: string, patterns: readonly string[]): boolean {
  return patterns.length === 0 || patterns.some((pattern) => wildcardPattern(pattern).test(name))
}

async function listedRows(ctx: CommandContext, dir: string, line: CommandLine): Promise<BranchRow[]> {
  const rows = await rowsPassing(ctx, dir, await selectedRows(ctx, dir, line), await revisionFilters(ctx, dir, line))
  const patterns = line.has('-l', '--list', '--contains', '--merged', '--no-merged') ? line.operands : []
  return rows.filter((row) => matchesAnyPattern(row.name, patterns))
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
  line: CommandLine,
): Promise<CommandOutput[]> {
  const rows = await listedRows(ctx, dir, line)
  const level = line.count('-v', '--verbose')
  if (rows.length === 0) return silent
  if (level === 0) return say(rows.map((row) => `${row.marker} ${row.name}`).join('\n'))

  const width = Math.max(0, ...rows.map((row) => row.name.length))
  const lines: string[] = []
  for (const row of rows) lines.push(await verboseLine(ctx, dir, row, width, level > 1))
  return say(lines.join('\n'))
}
