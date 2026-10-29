import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { flagMissingValue, flagValues, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { CourseExplanationError, SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { commitSignature, headOid } from '@/lib/git-sim/history/repository'
import { formatCommitSummary } from '@/lib/git-sim/history/commitSummary'
import { readCommitFilesOrEmpty, readIndexFiles } from '@/lib/git-sim/working-tree/treeContents'
import { readWorkingTree } from '@/lib/git-sim/working-tree/workingTree'
import { endMerge, readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { refuseOutsideRepository, repoPrefix, specMatcher } from '@/lib/git-sim/fs/pathspec'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists } from '@/lib/git-sim/fs/fileOperations'
import { formatStatus } from '@/lib/git-sim/working-tree/longStatus'
import { stageTrackedChanges } from '@/lib/git-sim/working-tree/stageTracked'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const NO_EDITOR_LINE = "This practice terminal has no text editor, so you can't type a message in one."

const NO_EDITOR = [NO_EDITOR_LINE, 'Add the message to the command instead: git commit -m "your message"'].join('\n')

const NO_EDITOR_MID_MERGE = [
  NO_EDITOR_LINE,
  'To keep the message Git wrote for this merge, run: git commit --no-edit',
].join('\n')

const NO_EDITOR_AMEND = [
  NO_EDITOR_LINE,
  'Add a new message with git commit --amend -m "your message", or keep the old one with git commit --amend --no-edit',
].join('\n')

const NOTHING_TO_AMEND = 'fatal: You have nothing to amend.'

const MESSAGE_FLAGS = ['-m', '--message']

function messageOf(args: readonly string[]): string | undefined {
  const paragraphs = flagValues(args, ...MESSAGE_FLAGS)
  return paragraphs.length > 0 ? paragraphs.join('\n\n') : undefined
}

function requireMessage(message: string | undefined, noEditor: string): string {
  if (message === undefined) throw new CourseExplanationError(noEditor)
  if (message.trim() === '') throw new SandboxError('Aborting commit due to empty commit message.')
  return message
}

async function summarize(
  ctx: CommandContext,
  dir: string,
  recorded: { oid: string; base: string | null; rootCommit: boolean; showAuthorDate: boolean },
): Promise<string> {
  return formatCommitSummary(ctx, dir, {
    oid: recorded.oid,
    before: await readCommitFilesOrEmpty(ctx, dir, recorded.base),
    after: await readIndexFiles(ctx, dir),
    rootCommit: recorded.rootCommit,
    showAuthorDate: recorded.showAuthorDate,
  })
}

async function writeCommit(
  ctx: CommandContext,
  dir: string,
  message: string,
  parent: string[] | undefined,
): Promise<string> {
  const author = await commitSignature(ctx, dir)
  return git.commit({ fs: gitFs(ctx.fs), dir, message, author, committer: author, parent })
}

async function recordCommit(
  args: readonly string[],
  ctx: CommandContext,
  dir: string,
): Promise<CommandOutput[]> {
  const merge = await readMergeInProgress(ctx, dir)
  const paths = await namedPaths(args, ctx, dir)
  if (paths.length > 0 && merge) throw new SandboxError('fatal: cannot do a partial commit during a merge.')

  const reused = merge && hasFlag(args, '--no-edit') ? merge.message : undefined
  const message = requireMessage(messageOf(args) ?? reused, merge ? NO_EDITOR_MID_MERGE : NO_EDITOR)

  if (hasFlag(args, '-a', '--all')) await stageTrackedChanges(ctx, dir)
  const restoreOthers = paths.length > 0 ? await stageOnly(ctx, dir, paths) : null

  try {
    const tree = await readWorkingTree(ctx, dir)
    const allowEmpty = hasFlag(args, '--allow-empty')
    if (!merge && !allowEmpty && tree.staged.length === 0) throw new SandboxError(await formatStatus(ctx, dir))

    const base = await headOid(ctx, dir)
    const joined = merge && base ? [base, merge.theirs] : undefined
    const oid = await writeCommit(ctx, dir, message, joined)
    if (merge) await endMerge(ctx, dir)
    await recordHeadMove(ctx, dir)

    const summary = await summarize(ctx, dir, {
      oid,
      base,
      rootCommit: base === null,
      showAuthorDate: false,
    })
    return say(merge ? (summary.split('\n')[0] ?? summary) : summary)
  } finally {
    if (restoreOthers) await restoreOthers()
  }
}

export function concludeMerge(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  return recordCommit(['--no-edit'], ctx, dir)
}

async function amendCommit(
  args: readonly string[],
  ctx: CommandContext,
  dir: string,
): Promise<CommandOutput[]> {
  const head = await headOid(ctx, dir)
  if (!head) throw new SandboxError(NOTHING_TO_AMEND)

  const { commit: replaced } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: head })
  const reused = hasFlag(args, '--no-edit') ? replaced.message.trimEnd() : undefined
  const message = requireMessage(messageOf(args) ?? reused, NO_EDITOR_AMEND)

  if (hasFlag(args, '-a', '--all')) await stageTrackedChanges(ctx, dir)

  const committer = await commitSignature(ctx, dir)
  const oid = await git.commit({ fs: gitFs(ctx.fs), dir, message, committer, amend: true })
  await recordHeadMove(ctx, dir)

  return say(
    await summarize(ctx, dir, {
      oid,
      base: replaced.parent[0] ?? null,
      rootCommit: false,
      showAuthorDate: true,
    }),
  )
}

async function namedPaths(args: readonly string[], ctx: CommandContext, dir: string): Promise<string[]> {
  const specs = operandsOf(args, MESSAGE_FLAGS)
  if (specs.length === 0) return []
  if (hasFlag(args, '-a', '--all')) {
    throw new SandboxError(`fatal: paths '${specs[0] ?? ''} ...' with -a does not make sense`)
  }

  const head = await headOid(ctx, dir)
  const known = [
    ...new Set([
      ...(await git.listFiles({ fs: gitFs(ctx.fs), dir })),
      ...(await readCommitFilesOrEmpty(ctx, dir, head)).keys(),
    ]),
  ]
  const prefix = repoPrefix(ctx, dir)
  const matched = new Set<string>()
  for (const spec of specs) {
    refuseOutsideRepository(spec, prefix, dir)
    const hits = known.filter(specMatcher(spec, prefix))
    if (hits.length === 0) {
      throw new SandboxError(`error: pathspec '${spec}' did not match any file(s) known to git`)
    }
    hits.forEach((path) => matched.add(path))
  }
  return [...matched]
}

async function setIndexEntry(ctx: CommandContext, dir: string, path: string, contents: string | undefined): Promise<void> {
  const fs = gitFs(ctx.fs)
  const staged = await git.listFiles({ fs, dir })
  if (contents === undefined) {
    if (staged.includes(path)) await git.remove({ fs, dir, filepath: path })
    return
  }
  const oid = await git.writeBlob({ fs, dir, blob: new TextEncoder().encode(contents) })
  await git.updateIndex({ fs, dir, filepath: path, oid, add: true })
}

async function stageOnly(ctx: CommandContext, dir: string, paths: readonly string[]): Promise<() => Promise<void>> {
  const fs = gitFs(ctx.fs)
  const saved = await readIndexFiles(ctx, dir)
  const head = await readCommitFilesOrEmpty(ctx, dir, await headOid(ctx, dir))
  const named = new Set(paths)
  const others = [...new Set([...saved.keys(), ...head.keys()])].filter((path) => !named.has(path))

  for (const path of others) await setIndexEntry(ctx, dir, path, head.get(path))
  for (const path of paths) {
    if (await pathExists(ctx.fs, joinPath(dir, path))) await git.add({ fs, dir, filepath: path, force: true })
    else await setIndexEntry(ctx, dir, path, undefined)
  }

  return async () => {
    for (const path of others) await setIndexEntry(ctx, dir, path, saved.get(path))
  }
}

function refuseEmptyMessageFlag(args: readonly string[]): void {
  const flag = flagMissingValue(args, ...MESSAGE_FLAGS)
  if (flag === undefined) return
  throw new SandboxError(
    flag.startsWith('--')
      ? `error: option \`${flag.slice(2)}' requires a value`
      : `error: switch \`${flag.slice(1)}' requires a value`,
  )
}

export const commit: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    refuseEmptyMessageFlag(args)
    const outputs = await commitOrAmend(args, ctx, dir)
    return hasFlag(args, '-q', '--quiet') ? outputs.filter((output) => output.stream === 'stderr') : outputs
  },
}

async function commitOrAmend(args: readonly string[], ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  if (!hasFlag(args, '--amend')) return recordCommit(args, ctx, dir)
  if (await readMergeInProgress(ctx, dir)) {
    throw new SandboxError('fatal: You are in the middle of a merge -- cannot amend.')
  }

  for (const path of await namedPaths(args, ctx, dir)) {
    await git.add({ fs: gitFs(ctx.fs), dir, filepath: path, force: true })
  }
  return amendCommit(args, ctx, dir)
}
