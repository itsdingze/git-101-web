import { SandboxError } from '@/lib/git-sim/errors'
import { readUnmergedEntries } from '@/lib/git-sim/working-tree/indexStages'
import { readMergeInProgress } from './mergeInProgress'
import type { CommandContext } from '@/lib/git-sim/types'

type Verb = 'Merging' | 'Pulling'

const CANNOT_SWITCH = [
  'fatal: cannot switch branch while merging',
  'Consider "git merge --quit" or "git worktree add".',
].join('\n')

const UNFINISHED: Record<Verb, string> = {
  Merging: ['fatal: You have not concluded your merge (MERGE_HEAD exists).', 'Please, commit your changes before you merge.'].join('\n'),
  Pulling: [
    'error: You have not concluded your merge (MERGE_HEAD exists).',
    'hint: Please, commit your changes before merging.',
    'fatal: Exiting because of unfinished merge.',
  ].join('\n'),
}

function unresolvedRefusal(verb: Verb): string {
  return [
    `error: ${verb} is not possible because you have unmerged files.`,
    "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
    'hint: as appropriate to mark resolution and make a commit.',
    'fatal: Exiting because of an unresolved conflict.',
  ].join('\n')
}

export async function refuseWhileUnmerged(ctx: CommandContext, dir: string): Promise<void> {
  const unmerged = await readUnmergedEntries(ctx, dir)
  if (unmerged.length === 0) return
  throw new SandboxError(
    ['error: you need to resolve your current index first', ...unmerged.map(({ path }) => `${path}: needs merge`)].join('\n'),
  )
}

export async function refuseSwitchWhileMerging(ctx: CommandContext, dir: string): Promise<void> {
  if (await readMergeInProgress(ctx, dir)) throw new SandboxError(CANNOT_SWITCH)
  await refuseWhileUnmerged(ctx, dir)
}

export async function refuseMergeWhileMerging(ctx: CommandContext, dir: string, verb: Verb): Promise<void> {
  if ((await readUnmergedEntries(ctx, dir)).length > 0) throw new SandboxError(unresolvedRefusal(verb))
  if (await readMergeInProgress(ctx, dir)) throw new SandboxError(UNFINISHED[verb])
}
