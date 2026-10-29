import git from 'isomorphic-git'
import type { ReadCommitResult } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { firstUnknownOption, type KnownOptions } from '@/lib/git-sim/input/knownOptions'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { STASH_REF } from '@/lib/git-sim/stash/stashLog'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { createCommitGraph, topoOrderCommits } from '@/lib/git-sim/history/commitGraph'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { decorationLabel, readDecorations, type RefDecorations } from '@/lib/git-sim/history/decorations'
import { fullCommitLines } from '@/lib/git-sim/history/fullCommitLines'
import { commitsTouching } from '@/lib/git-sim/history/touchedPaths'
import { matchAny, repoPrefix } from '@/lib/git-sim/fs/pathspec'
import { pathExists } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

const DEFAULT_DEPTH = 200
const VALUE_FLAGS = ['-n', '--max-count', '--grep', '--author']

type LogOperands = { included: string[]; excluded: string[]; paths: string[] }

function countFlag(args: readonly string[]): number | undefined {
  const shorthand = args.find((arg) => /^-\d+$/.test(arg))
  if (shorthand) return Number(shorthand.slice(1))

  const value = flagValue(args, '-n', '--max-count')
  if (value === undefined) return undefined
  if (!/^[+-]?\d+$/.test(value)) throw new SandboxError(`fatal: '${value}': not an integer`)
  return Number(value)
}

function ambiguousArgument(spec: string): SandboxError {
  return new SandboxError(
    [
      `fatal: ambiguous argument '${spec}': unknown revision or path not in the working tree.`,
      "Use '--' to separate paths from revisions, like this:",
      "'git <command> [<revision>...] -- [<file>...]'",
    ].join('\n'),
  )
}

async function logOperands(ctx: CommandContext, dir: string, args: readonly string[]): Promise<LogOperands> {
  const separator = args.indexOf('--')
  const leading = operandsOf(separator === -1 ? args : args.slice(0, separator), VALUE_FLAGS)
  const named = separator === -1 ? [] : args.slice(separator + 1)

  const operands: LogOperands = { included: [], excluded: [], paths: [] }
  for (const operand of leading) {
    if (operands.paths.length === 0 && (await addRevision(ctx, dir, operand, operands))) continue
    if (!(await pathExists(ctx.fs, resolvePath(operand, ctx.cwd, ctx.root)))) throw ambiguousArgument(operand)
    operands.paths.push(operand)
  }
  return { ...operands, paths: [...operands.paths, ...named] }
}

async function addRevision(ctx: CommandContext, dir: string, operand: string, operands: LogOperands): Promise<boolean> {
  const range = operand.includes('...') ? null : operand.split('..')
  if (range?.length === 2) {
    const [from = '', to = ''] = range
    const excluded = await resolveCommitish(ctx, dir, from || 'HEAD')
    const included = await resolveCommitish(ctx, dir, to || 'HEAD')
    if (!excluded || !included) return false
    operands.excluded.push(excluded)
    operands.included.push(included)
    return true
  }
  const oid = await resolveCommitish(ctx, dir, operand)
  if (oid) operands.included.push(oid)
  return oid !== null
}

async function reachableOids(ctx: CommandContext, dir: string, refs: readonly string[]): Promise<Map<string, ReadCommitResult>> {
  const byOid = new Map<string, ReadCommitResult>()
  for (const ref of refs) {
    const entries = await git.log({ fs: gitFs(ctx.fs), dir, ref, depth: DEFAULT_DEPTH })
    for (const entry of entries) byOid.set(entry.oid, entry)
  }
  return byOid
}

async function allRefs(ctx: CommandContext, dir: string): Promise<string[]> {
  const fs = gitFs(ctx.fs)
  const refs = (await git.listBranches({ fs, dir })).map((name) => `refs/heads/${name}`)
  for (const { remote } of await git.listRemotes({ fs, dir })) {
    for (const name of await git.listBranches({ fs, dir, remote })) refs.push(`refs/remotes/${remote}/${name}`)
  }
  if (await refOid(ctx, dir, STASH_REF)) refs.push(STASH_REF)
  return refs
}

async function collectCommits(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
  { included, excluded }: LogOperands,
): Promise<ReadCommitResult[]> {
  const starts = included.length > 0 ? included : ['HEAD']
  const refs = hasFlag(args, '--all') ? await allRefs(ctx, dir) : starts
  const hidden = await reachableOids(ctx, dir, excluded)
  const shown = [...(await reachableOids(ctx, dir, refs)).values()].filter((entry) => !hidden.has(entry.oid))

  return shown.sort(
    (a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp,
  )
}

function applyFilters(
  commits: readonly ReadCommitResult[],
  args: readonly string[],
): ReadCommitResult[] {
  const grep = flagValue(args, '--grep')
  const author = flagValue(args, '--author')

  let filtered = [...commits]
  if (grep) filtered = filtered.filter((entry) => entry.commit.message.includes(grep))
  if (author) filtered = filtered.filter((entry) => entry.commit.author.name.includes(author))
  return filtered
}

function limited<T>(items: readonly T[], args: readonly string[]): T[] {
  const count = countFlag(args)
  return count !== undefined && Number.isFinite(count) ? items.slice(0, count) : [...items]
}

function onelineText(entry: ReadCommitResult, decorations: RefDecorations): string {
  return `${shortOid(entry.oid)}${decorationLabel(decorations, entry.oid)} ${commitSubject(entry.commit.message)}`
}

function renderPlain(
  commits: readonly ReadCommitResult[],
  decorations: RefDecorations,
  oneline: boolean,
): string {
  if (oneline) return commits.map((entry) => onelineText(entry, decorations)).join('\n')
  return commits.flatMap((entry) => fullCommitLines(entry, decorations)).join('\n').trimEnd()
}

function renderGraph(
  commits: readonly ReadCommitResult[],
  decorations: RefDecorations,
  oneline: boolean,
  args: readonly string[],
): string {
  const byOid = new Map(commits.map((entry) => [entry.oid, entry]))
  const ordered = topoOrderCommits(
    commits.map((entry) => ({ oid: entry.oid, parents: entry.commit.parent })),
  )
  const graph = createCommitGraph(ordered)

  return limited(ordered, args)
    .flatMap((commit, index) => {
      const entry = byOid.get(commit.oid)
      if (!entry) return []
      const message = oneline ? [onelineText(entry, decorations)] : fullCommitLines(entry, decorations).slice(0, -1)
      return graph.draw(commit, message, !oneline && index > 0)
    })
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd()
}

const LOG_OPTIONS: KnownOptions = {
  flags: ['--oneline', '--graph', '--all', '--no-decorate', '--decorate'],
  valueFlags: VALUE_FLAGS,
  countShorthand: true,
}

export const log: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const unknown = firstUnknownOption(args, LOG_OPTIONS)
    if (unknown) throw new SandboxError(`fatal: unrecognized argument: ${unknown}`)
    countFlag(args)

    if (!(await headOid(ctx, dir))) {
      const branch = (await currentBranch(ctx, dir)) ?? 'main'
      throw new SandboxError(`fatal: your current branch '${branch}' does not have any commits yet`)
    }

    const operands = await logOperands(ctx, dir, args)
    const { paths } = operands
    const history = await collectCommits(ctx, dir, args, operands)
    const touching = paths.length === 0 ? history : await commitsTouching(ctx, dir, history, matchAny(paths, repoPrefix(ctx, dir)))
    const commits = applyFilters(touching, args)
    if (commits.length === 0) return silent

    const decorations = hasFlag(args, '--no-decorate')
      ? new Map<string, string[]>()
      : await readDecorations(ctx, dir)
    const oneline = hasFlag(args, '--oneline')

    return say(
      hasFlag(args, '--graph')
        ? renderGraph(commits, decorations, oneline, args)
        : renderPlain(limited(commits, args), decorations, oneline),
    )
  },
}
