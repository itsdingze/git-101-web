import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent, stderr, stdout } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { currentBranch, headOid, shortOid } from '@/lib/git-sim/history/repository'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { readWorkingTree } from '@/lib/git-sim/working-tree/workingTree'
import { isOwnKey } from '@/lib/isOwnKey'
import {
  entryMessage,
  entryOid,
  readStashLog,
  recordStashEntry,
  STASH_REF,
  writeStashLog,
} from '@/lib/git-sim/stash/stashLog'
import { restoreStash } from '@/lib/git-sim/stash/stashRestore'
import { readUnmergedEntries } from '@/lib/git-sim/working-tree/indexStages'
import { endMerge } from '@/lib/git-sim/merge/mergeInProgress'
import { stashPathLimit } from '@/lib/git-sim/stash/stashPaths'
import { shelveWork } from '@/lib/git-sim/stash/stashShelve'
import { formatStatus } from '@/lib/git-sim/working-tree/longStatus'
import type { CommandContext, CommandOutput, GitCommandHandler, GitSubcommand } from '@/lib/git-sim/types'

const MESSAGE_FLAGS = ['-m', '--message']
const NO_ENTRIES = 'No stash entries found.'
const KEPT = 'The stash entry is kept in case you need it again.'

async function headLine(ctx: CommandContext, dir: string, head: string): Promise<string> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: head })
  return `${shortOid(head)} ${commitSubject(commit.message)}`
}

function describeShelving(args: readonly string[], branch: string, line: string): string {
  const note = flagValue(args, ...MESSAGE_FLAGS)?.trim()
  return note ? `On ${branch}: ${note}` : `WIP on ${branch}: ${line}`
}

async function refuseUnmergedIndex(ctx: CommandContext, dir: string): Promise<void> {
  const unmerged = await readUnmergedEntries(ctx, dir)
  if (unmerged.length > 0) {
    throw new SandboxError(['error: could not write index', ...unmerged.map(({ path }) => `${path}: needs merge`)].join('\n'))
  }
}

type StashLine = { subcommand: string; pathspecs: string[] }

function readStashLine(args: readonly string[]): StashLine {
  const dashes = args.indexOf('--')
  const before = dashes === -1 ? args : args.slice(0, dashes)
  const after = dashes === -1 ? [] : args.slice(dashes + 1)
  const [subcommand = 'push', ...rest] = operandsOf(before, MESSAGE_FLAGS)
  return { subcommand, pathspecs: subcommand === 'push' ? [...rest, ...after] : [] }
}

const push: GitCommandHandler = async (args, ctx, dir) => {
  const head = await headOid(ctx, dir)
  if (!head) throw new SandboxError('You do not have the initial commit yet')

  const branch = await currentBranch(ctx, dir)
  if (!branch) throw new SandboxError("fatal: this course can't stash on a detached HEAD.")

  await refuseUnmergedIndex(ctx, dir)

  const tree = await readWorkingTree(ctx, dir)
  const includeUntracked = hasFlag(args, '-u', '--include-untracked')
  const limit = await stashPathLimit(ctx, dir, readStashLine(args).pathspecs, includeUntracked ? tree.untracked : [])
  const inScope = (path: string) => limit === null || limit(path)
  const untracked = (includeUntracked ? tree.untracked : []).filter(inScope)
  const changes = [...tree.staged, ...tree.unstaged].filter((change) => inScope(change.path))
  if (changes.length + untracked.length === 0) {
    return say('No local changes to save')
  }

  const line = await headLine(ctx, dir, head)
  const message = describeShelving(args, branch, line)
  const oid = await shelveWork(ctx, dir, { branch, head, headLine: line, message, untracked, limit })
  if (limit === null) await endMerge(ctx, dir)
  await recordStashEntry(ctx, dir, oid, message)
  await recordHeadMove(ctx, dir)

  return say(`Saved working directory and index state ${message}`)
}

type EntryName = { label: string; position: number }

const NAMED_ENTRY = /^((?:refs\/)?stash)@\{(\d+)\}$/

function entryNameOf(args: readonly string[]): EntryName {
  const named = operandsOf(args, MESSAGE_FLAGS)[1]
  if (named === undefined) return { label: `${STASH_REF}@{0}`, position: 0 }
  if (/^\d+$/.test(named)) return { label: `${STASH_REF}@{${named}}`, position: Number(named) }

  const match = NAMED_ENTRY.exec(named)
  if (!match) throw new SandboxError(`error: ${named} is not a valid reference`)
  return { label: named, position: Number(match[2]) }
}

function lineIndexOf(lines: readonly string[], name: EntryName): number {
  if (lines.length === 0) throw new SandboxError(NO_ENTRIES)
  if (name.position >= lines.length) {
    const log = name.label.split('@')[0]
    throw new SandboxError(`fatal: log for '${log}' only has ${lines.length} entries`)
  }
  return lines.length - 1 - name.position
}

async function namedEntryOid(ctx: CommandContext, dir: string, name: EntryName): Promise<string> {
  const lines = await readStashLog(ctx, dir)
  return entryOid(lines[lineIndexOf(lines, name)] ?? '')
}

async function dropEntry(ctx: CommandContext, dir: string, name: EntryName): Promise<string> {
  const lines = await readStashLog(ctx, dir)
  const index = lineIndexOf(lines, name)
  const dropped = lines[index] ?? ''

  await writeStashLog(ctx, dir, lines.filter((_, at) => at !== index))
  return `Dropped ${name.label} (${entryOid(dropped)})`
}

async function bringBack(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
  dropAfterwards: boolean,
): Promise<CommandOutput[]> {
  const name = entryNameOf(args)
  await refuseUnmergedIndex(ctx, dir)
  const restored = await restoreStash(ctx, dir, await namedEntryOid(ctx, dir, name), hasFlag(args, '--index'))
  const status = await formatStatus(ctx, dir)
  const kept = dropAfterwards ? [stderr(KEPT)] : []

  if (restored.kind === 'failed') return [stderr(restored.message), ...kept]
  if (restored.kind === 'refused') return [stderr(restored.message), stdout(status), ...kept]

  if (restored.untrackedError) {
    const merged = restored.report.length > 0 ? [stdout(restored.report.join('\n'))] : []
    return [...merged, stderr(restored.untrackedError), stdout(status), ...kept]
  }

  const report = [...restored.report, status].join('\n')
  if (restored.conflicted) return [stdout(report), ...kept]
  if (!dropAfterwards) return say(report)
  return say(`${report}\n${await dropEntry(ctx, dir, name)}`)
}

const pop: GitCommandHandler = (args, ctx, dir) => bringBack(ctx, dir, args, true)

const apply: GitCommandHandler = (args, ctx, dir) => bringBack(ctx, dir, args, false)

const drop: GitCommandHandler = async (args, ctx, dir) => say(await dropEntry(ctx, dir, entryNameOf(args)))

const list: GitCommandHandler = async (_args, ctx, dir) => {
  const lines = await readStashLog(ctx, dir)
  if (lines.length === 0) return silent

  const entries = lines.reverse().map((line, index) => `stash@{${index}}: ${entryMessage(line)}`)
  return say(entries.join('\n'))
}

const clear: GitCommandHandler = async (_args, ctx, dir) => {
  if ((await readStashLog(ctx, dir)).length > 0) await writeStashLog(ctx, dir, [])
  return silent
}

const OPERATIONS: Record<string, GitCommandHandler> = { push, pop, apply, drop, list, clear }

const UNSIMULATED_OPERATIONS = ['show', 'branch', 'save', 'create', 'store']

export const stash: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const name = readStashLine(args).subcommand
    const operation = isOwnKey(OPERATIONS, name) ? OPERATIONS[name] : undefined
    if (UNSIMULATED_OPERATIONS.includes(name)) {
      throw new SandboxError(`fatal: this course doesn't simulate git stash ${name}.`)
    }
    if (!operation) {
      throw new SandboxError(
        `fatal: subcommand wasn't specified; 'push' can't be assumed due to unexpected token '${name}'`,
      )
    }

    return operation(args, ctx, dir)
  },
}
