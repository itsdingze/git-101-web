import { fail } from '@/lib/git-sim/output'
import { unlockedCommandNames } from './gitUsage'
import type { CommandOutput } from '@/lib/git-sim/types'

export type CommandLocks = ReadonlyMap<string, string>

export const NO_LOCKS: CommandLocks = new Map()

export function lockedCommand(
  name: string,
  unlocksIn: string,
  locks: CommandLocks,
): CommandOutput[] {
  return fail(
    [
      `git ${name} is taught in ${unlocksIn}.`,
      `Available now: ${unlockedCommandNames(locks).join(', ')}`,
    ].join('\n'),
  )
}
