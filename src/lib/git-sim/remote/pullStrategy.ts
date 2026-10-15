import { hasFlag } from '@/lib/git-sim/input/parseArgs'
import { readSetting } from '@/lib/git-sim/history/repository'
import type { CommandContext } from '@/lib/git-sim/types'

type PullStrategy = 'unspecified' | 'merge' | 'rebase' | 'ff-only'

const UNSPECIFIED = [
  'hint: You have divergent branches and need to specify how to reconcile them.',
  'hint: You can do so by running one of the following commands sometime before',
  'hint: your next pull:',
  'hint:',
  'hint:   git config pull.rebase false  # merge',
  'hint:   git config pull.rebase true   # rebase',
  'hint:   git config pull.ff only       # fast-forward only',
  'hint:',
  'hint: You can replace "git config" with "git config --global" to set a default',
  'hint: preference for all repositories. You can also pass --rebase, --no-rebase,',
  'hint: or --ff-only on the command line to override the configured default per',
  'hint: invocation.',
  'fatal: Need to specify how to reconcile divergent branches.',
].join('\n')

const FAST_FORWARD_ONLY = [
  "hint: Diverging branches can't be fast-forwarded, you need to either:",
  'hint:',
  'hint: \tgit merge --no-ff',
  'hint:',
  'hint: or:',
  'hint:',
  'hint: \tgit rebase',
  'hint:',
  'hint: Disable this message with "git config advice.diverging false"',
  'fatal: Not possible to fast-forward, aborting.',
].join('\n')

const REBASE = [
  "fatal: this course doesn't simulate git pull --rebase.",
  "hint: merge instead with 'git pull --no-rebase', or set 'git config pull.rebase false'.",
].join('\n')

function strategyFromFlags(args: readonly string[]): PullStrategy | null {
  if (hasFlag(args, '--ff-only')) return 'ff-only'
  if (hasFlag(args, '--no-rebase')) return 'merge'
  if (hasFlag(args, '--rebase', '-r')) return 'rebase'
  return null
}

async function strategyFromConfig(ctx: CommandContext, dir: string): Promise<PullStrategy> {
  if ((await readSetting(ctx, dir, 'pull.ff')) === 'only') return 'ff-only'

  const rebase = await readSetting(ctx, dir, 'pull.rebase')
  if (rebase === undefined) return 'unspecified'
  return rebase === 'false' ? 'merge' : 'rebase'
}

export async function pullStrategyOf(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
): Promise<PullStrategy> {
  return strategyFromFlags(args) ?? (await strategyFromConfig(ctx, dir))
}

export function divergedRefusal(strategy: PullStrategy): string | null {
  switch (strategy) {
    case 'merge':
      return null
    case 'unspecified':
      return UNSPECIFIED
    case 'ff-only':
      return FAST_FORWARD_ONLY
    case 'rebase':
      return REBASE
  }
}
