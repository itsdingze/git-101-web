import git from 'isomorphic-git'
import type { ReadCommitResult } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { currentBranch, headOid, shortOid } from '@/lib/git-sim/repository'
import { commitSubject } from '@/lib/git-sim/commitSubject'
import { formatGitDate } from '@/lib/git-sim/formatDate'
import { renderCommitGraph, topoOrderCommits } from '@/lib/git-sim/commitGraph'
import { resolveCommitish } from '@/lib/git-sim/resolveCommitish'
import { decorationLabel, readDecorations, type RefDecorations } from './decorations'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

const DEFAULT_DEPTH = 200
const VALUE_FLAGS = ['-n', '--max-count', '--grep', '--author']

function countFlag(args: readonly string[]): number | undefined {
  const shorthand = args.find((arg) => /^-\d+$/.test(arg))
  if (shorthand) return Number(shorthand.slice(1))

  const value = flagValue(args, '-n', '--max-count')
  return value === undefined ? undefined : Number(value)
}

function withoutFlagValues(args: readonly string[]): string[] {
  const consumed = new Set(
    args.flatMap((arg, index) => (VALUE_FLAGS.includes(arg) ? [index + 1] : [])),
  )
  return args.filter((_, index) => !consumed.has(index))
}

async function startingRef(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
): Promise<string> {
  const spec = operandsOf(withoutFlagValues(args))[0]
  if (!spec) return 'HEAD'
  return (await resolveCommitish(ctx, dir, spec)) ?? spec
}

async function collectCommits(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
): Promise<ReadCommitResult[]> {
  const refs = hasFlag(args, '--all')
    ? (await git.listBranches({ fs: gitFs(ctx.fs), dir })).map((name) => `refs/heads/${name}`)
    : [await startingRef(ctx, dir, args)]

  const byOid = new Map<string, ReadCommitResult>()
  for (const ref of refs) {
    const entries = await git.log({ fs: gitFs(ctx.fs), dir, ref, depth: DEFAULT_DEPTH })
    for (const entry of entries) byOid.set(entry.oid, entry)
  }

  return [...byOid.values()].sort(
    (a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp,
  )
}

function applyFilters(
  commits: readonly ReadCommitResult[],
  args: readonly string[],
): ReadCommitResult[] {
  const grep = flagValue(args, '--grep')
  const author = flagValue(args, '--author')
  const count = countFlag(args)

  let filtered = [...commits]
  if (grep) filtered = filtered.filter((entry) => entry.commit.message.includes(grep))
  if (author) filtered = filtered.filter((entry) => entry.commit.author.name.includes(author))
  return count !== undefined && Number.isFinite(count) ? filtered.slice(0, count) : filtered
}

function onelineText(entry: ReadCommitResult, decorations: RefDecorations): string {
  return `${shortOid(entry.oid)}${decorationLabel(decorations, entry.oid)} ${commitSubject(entry.commit.message)}`
}

function longLines(entry: ReadCommitResult, decorations: RefDecorations): string[] {
  const { author, message } = entry.commit
  return [
    `commit ${entry.oid}${decorationLabel(decorations, entry.oid)}`,
    ...(entry.commit.parent.length > 1
      ? [`Merge: ${entry.commit.parent.map(shortOid).join(' ')}`]
      : []),
    `Author: ${author.name} <${author.email}>`,
    `Date:   ${formatGitDate(author.timestamp, author.timezoneOffset)}`,
    '',
    ...message.trimEnd().split('\n').map((line) => `    ${line}`),
    '',
  ]
}

function renderPlain(
  commits: readonly ReadCommitResult[],
  decorations: RefDecorations,
  oneline: boolean,
): string {
  if (oneline) return commits.map((entry) => onelineText(entry, decorations)).join('\n')
  return commits.flatMap((entry) => longLines(entry, decorations)).join('\n').trimEnd()
}

function renderGraph(
  commits: readonly ReadCommitResult[],
  decorations: RefDecorations,
  oneline: boolean,
): string {
  const byOid = new Map(commits.map((entry) => [entry.oid, entry]))
  const ordered = topoOrderCommits(
    commits.map((entry) => ({ oid: entry.oid, parents: entry.commit.parent })),
  )
  const rows = renderCommitGraph(ordered)

  return rows
    .flatMap((row) => {
      if (!row.oid) return [row.prefix.trimEnd()]
      const entry = byOid.get(row.oid)
      if (!entry) return []
      if (oneline) return [`${row.prefix} ${onelineText(entry, decorations)}`.trimEnd()]

      const continuation = row.prefix.replace('*', '|')
      return longLines(entry, decorations).map((line, index) =>
        `${index === 0 ? row.prefix : continuation} ${line}`.trimEnd(),
      )
    })
    .join('\n')
}

export const log: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (!(await headOid(ctx, dir))) {
      const branch = (await currentBranch(ctx, dir)) ?? 'main'
      throw new SandboxError(`fatal: your current branch '${branch}' does not have any commits yet`)
    }

    const commits = applyFilters(await collectCommits(ctx, dir, args), args)
    if (commits.length === 0) return silent

    const decorations = hasFlag(args, '--no-decorate')
      ? new Map<string, string[]>()
      : await readDecorations(ctx, dir)
    const oneline = hasFlag(args, '--oneline')

    return say(
      hasFlag(args, '--graph')
        ? renderGraph(commits, decorations, oneline)
        : renderPlain(commits, decorations, oneline),
    )
  },
}
