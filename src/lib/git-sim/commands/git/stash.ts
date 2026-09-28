import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/headHistory'
import { joinPath } from '@/lib/git-sim/paths'
import { pathExists, readText, removeTree, writeText } from '@/lib/git-sim/fileOperations'
import { commitSignature, currentBranch, headOid, shortOid } from '@/lib/git-sim/repository'
import { commitSubject } from '@/lib/git-sim/commitSubject'
import { readCommitFiles } from '@/lib/git-sim/treeContents'
import { readWorkingTree } from '@/lib/git-sim/workingTree'
import { formatStatus } from './status'
import { stageTrackedChanges } from './stageTracked'
import type { CommandContext, GitCommandHandler, GitSubcommand } from '@/lib/git-sim/types'

const STASH_REF = 'refs/stash'
const MESSAGE_FLAGS = ['-m', '--message']
const NO_ENTRIES = 'No stash entries found.'
const ZERO_OID = '0'.repeat(40)

function stashLogPath(dir: string): string {
  return joinPath(dir, '.git/logs/refs/stash')
}

function entryOid(line: string): string {
  return line.split(' ')[1] ?? ''
}

function entryMessage(line: string): string {
  return line.split('\t')[1] ?? ''
}

function newestOf(lines: readonly string[]): string | undefined {
  return lines[lines.length - 1]
}

async function readStashLog(ctx: CommandContext, dir: string): Promise<string[]> {
  const path = stashLogPath(dir)
  if (!(await pathExists(ctx.fs, path))) return []
  return (await readText(ctx.fs, path)).split('\n').filter(Boolean)
}

async function writeStashLog(
  ctx: CommandContext,
  dir: string,
  lines: readonly string[],
): Promise<void> {
  const newest = newestOf(lines)
  if (!newest) {
    await removeTree(ctx.fs, stashLogPath(dir))
    await git.deleteRef({ fs: gitFs(ctx.fs), dir, ref: STASH_REF })
    return
  }

  await writeText(ctx.fs, stashLogPath(dir), `${lines.join('\n')}\n`)
  await git.writeRef({
    fs: gitFs(ctx.fs),
    dir,
    ref: STASH_REF,
    value: entryOid(newest),
    force: true,
  })
}

async function recordEntry(
  ctx: CommandContext,
  dir: string,
  oid: string,
  message: string,
): Promise<void> {
  const author = await commitSignature(ctx, dir)
  const who = `${author.name} <${author.email}> ${author.timestamp} +0000`
  const line = `${ZERO_OID} ${oid} ${who}\t${message}`
  await writeStashLog(ctx, dir, [...(await readStashLog(ctx, dir)), line])
}

async function describeShelving(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
  branch: string,
  head: string,
): Promise<string> {
  const note = flagValue(args, ...MESSAGE_FLAGS)?.trim()
  if (note) return `On ${branch}: ${note}`

  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: head })
  return `WIP on ${branch}: ${shortOid(head)} ${commitSubject(commit.message)}`
}

type Shelving = {
  branch: string
  head: string
  message: string
  untracked: readonly string[]
}

async function snapshotIndex(ctx: CommandContext, dir: string, shelving: Shelving): Promise<string> {
  const author = await commitSignature(ctx, dir)
  return git.commit({
    fs: gitFs(ctx.fs),
    dir,
    message: `index on ${shelving.branch}`,
    author,
    committer: author,
    parent: [shelving.head],
    noUpdateBranch: true,
  })
}

async function shelve(ctx: CommandContext, dir: string, shelving: Shelving): Promise<string> {
  const index = await snapshotIndex(ctx, dir, shelving)

  await stageTrackedChanges(ctx, dir)
  for (const path of shelving.untracked) {
    await git.add({ fs: gitFs(ctx.fs), dir, filepath: path })
  }

  const author = await commitSignature(ctx, dir)
  const oid = await git.commit({
    fs: gitFs(ctx.fs),
    dir,
    message: shelving.message,
    author,
    committer: author,
    ref: STASH_REF,
    parent: [shelving.head, index],
  })

  await git.checkout({ fs: gitFs(ctx.fs), dir, ref: shelving.branch, force: true })
  return oid
}

const push: GitCommandHandler = async (args, ctx, dir) => {
  const head = await headOid(ctx, dir)
  if (!head) throw new SandboxError('You do not have the initial commit yet')

  const branch = await currentBranch(ctx, dir)
  if (!branch) throw new SandboxError('fatal: cannot stash on a detached HEAD in this course.')

  const tree = await readWorkingTree(ctx, dir)
  const untracked = hasFlag(args, '-u', '--include-untracked') ? tree.untracked : []
  if (tree.staged.length + tree.unstaged.length + untracked.length === 0) {
    return say('No local changes to save')
  }

  const message = await describeShelving(ctx, dir, args, branch, head)
  const oid = await shelve(ctx, dir, { branch, head, message, untracked })
  await recordEntry(ctx, dir, oid, message)
  await recordHeadMove(ctx, dir, 'reset: moving to HEAD')

  return say(`Saved working directory and index state ${message}`)
}

type Entry = {
  base: Map<string, string>
  shelved: Map<string, string>
  added: readonly string[]
}

async function parentsOf(ctx: CommandContext, dir: string, oid: string): Promise<string[]> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
  return [...commit.parent]
}

async function addedPaths(
  ctx: CommandContext,
  dir: string,
  index: string,
  base: Map<string, string>,
): Promise<string[]> {
  const staged = await readCommitFiles(ctx, dir, index)
  return [...staged.keys()].filter((path) => !base.has(path))
}

async function readEntry(ctx: CommandContext, dir: string, oid: string): Promise<Entry> {
  const [parent, index] = await parentsOf(ctx, dir, oid)
  const base = parent ? await readCommitFiles(ctx, dir, parent) : new Map<string, string>()

  return {
    base,
    shelved: await readCommitFiles(ctx, dir, oid),
    added: index ? await addedPaths(ctx, dir, index, base) : [],
  }
}

async function writeShelved(ctx: CommandContext, dir: string, entry: Entry): Promise<void> {
  for (const [path, contents] of entry.shelved) {
    if (entry.base.get(path) !== contents) await writeText(ctx.fs, joinPath(dir, path), contents)
  }
}

async function removeShelvedDeletions(
  ctx: CommandContext,
  dir: string,
  entry: Entry,
): Promise<void> {
  for (const path of entry.base.keys()) {
    if (entry.shelved.has(path)) continue
    const absolute = joinPath(dir, path)
    if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
  }
}

async function restageAdditions(ctx: CommandContext, dir: string, entry: Entry): Promise<void> {
  for (const path of entry.added) {
    await git.add({ fs: gitFs(ctx.fs), dir, filepath: path })
  }
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

async function restoreEntry(ctx: CommandContext, dir: string, name: EntryName): Promise<void> {
  const lines = await readStashLog(ctx, dir)
  const line = lines[lineIndexOf(lines, name)] ?? ''

  const entry = await readEntry(ctx, dir, entryOid(line))
  await writeShelved(ctx, dir, entry)
  await removeShelvedDeletions(ctx, dir, entry)
  await restageAdditions(ctx, dir, entry)
}

async function dropEntry(ctx: CommandContext, dir: string, name: EntryName): Promise<string> {
  const lines = await readStashLog(ctx, dir)
  const index = lineIndexOf(lines, name)
  const dropped = lines[index] ?? ''

  await writeStashLog(ctx, dir, lines.filter((_, at) => at !== index))
  return `Dropped ${name.label} (${entryOid(dropped)})`
}

const pop: GitCommandHandler = async (args, ctx, dir) => {
  const name = entryNameOf(args)
  await restoreEntry(ctx, dir, name)
  const status = await formatStatus(ctx, dir)
  const dropped = await dropEntry(ctx, dir, name)

  return say(`${status}\n${dropped}`)
}

const apply: GitCommandHandler = async (args, ctx, dir) => {
  await restoreEntry(ctx, dir, entryNameOf(args))
  return say(await formatStatus(ctx, dir))
}

const drop: GitCommandHandler = async (args, ctx, dir) =>
  say(await dropEntry(ctx, dir, entryNameOf(args)))

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

function subcommandOf(args: readonly string[]): string {
  return operandsOf(args, MESSAGE_FLAGS)[0] ?? 'push'
}

export const stash: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const name = subcommandOf(args)
    const operation = OPERATIONS[name]
    if (UNSIMULATED_OPERATIONS.includes(name)) {
      throw new SandboxError(`fatal: git stash ${name} is not simulated in this course.`)
    }
    if (!operation) {
      throw new SandboxError(
        `fatal: subcommand wasn't specified; 'push' can't be assumed due to unexpected token '${name}'`,
      )
    }

    return operation(args, ctx, dir)
  },
}
