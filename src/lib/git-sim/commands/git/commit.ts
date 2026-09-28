import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { flagValues, hasFlag } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/headHistory'
import { commitSignature, headOid } from '@/lib/git-sim/repository'
import { commitSubject } from '@/lib/git-sim/commitSubject'
import { formatCommitSummary } from '@/lib/git-sim/commitSummary'
import { readCommitFilesOrEmpty, readIndexFiles } from '@/lib/git-sim/treeContents'
import { readWorkingTree } from '@/lib/git-sim/workingTree'
import { endMerge, readMergeInProgress } from '@/lib/git-sim/mergeInProgress'
import { formatStatus } from './status'
import { stageTrackedChanges } from './stageTracked'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const NO_EDITOR = [
  'The sandbox has no text editor, so a commit message cannot be typed in one.',
  'Pass the message inline instead: git commit -m "your message"',
].join('\n')

const NOTHING_TO_AMEND = 'fatal: You have nothing to amend.'

function messageOf(args: readonly string[]): string | undefined {
  const paragraphs = flagValues(args, '-m', '--message')
  return paragraphs.length > 0 ? paragraphs.join('\n\n') : undefined
}

function requireMessage(message: string | undefined): string {
  if (message === undefined) throw new SandboxError(NO_EDITOR)
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

function reflogEntry(base: string | null, merging: boolean, message: string): string {
  const kind = merging ? 'commit (merge)' : base ? 'commit' : 'commit (initial)'
  return `${kind}: ${commitSubject(message)}`
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
  const message = requireMessage(messageOf(args))

  if (hasFlag(args, '-a', '--all')) await stageTrackedChanges(ctx, dir)

  const merge = await readMergeInProgress(ctx, dir)
  const tree = await readWorkingTree(ctx, dir)
  if (!merge && tree.staged.length === 0) throw new SandboxError(await formatStatus(ctx, dir))

  const base = await headOid(ctx, dir)
  const joined = merge && base ? [base, merge.theirs] : undefined
  const oid = await writeCommit(ctx, dir, message, joined)
  if (merge) await endMerge(ctx, dir)
  await recordHeadMove(ctx, dir, reflogEntry(base, merge !== null, message))

  return say(
    await summarize(ctx, dir, {
      oid,
      base,
      rootCommit: base === null,
      showAuthorDate: false,
    }),
  )
}

async function amendCommit(
  args: readonly string[],
  ctx: CommandContext,
  dir: string,
): Promise<CommandOutput[]> {
  const head = await headOid(ctx, dir)
  if (!head) throw new SandboxError(NOTHING_TO_AMEND)

  const { commit: replaced } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: head })
  const reused = hasFlag(args, '--no-edit') ? commitSubject(replaced.message) : undefined
  const message = requireMessage(messageOf(args) ?? reused)

  if (hasFlag(args, '-a', '--all')) await stageTrackedChanges(ctx, dir)

  const committer = await commitSignature(ctx, dir)
  const oid = await git.commit({ fs: gitFs(ctx.fs), dir, message, committer, amend: true })
  await recordHeadMove(ctx, dir, `commit (amend): ${commitSubject(message)}`)

  return say(
    await summarize(ctx, dir, {
      oid,
      base: replaced.parent[0] ?? null,
      rootCommit: false,
      showAuthorDate: true,
    }),
  )
}

export const commit: GitSubcommand = {
  requiresRepo: true,
  run: (args, ctx, dir) =>
    hasFlag(args, '--amend') ? amendCommit(args, ctx, dir) : recordCommit(args, ctx, dir),
}
