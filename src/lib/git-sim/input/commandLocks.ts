import { refuse } from '@/lib/git-sim/output'
import { unlockedCommandNames } from './gitUsage'
import type { GitCommandName } from '@/lib/git-sim/commands/git/registry'
import type { CommandOutput } from '@/lib/git-sim/types'

export type LockableCommand = GitCommandName | 'gh'

export type CommandLocks = ReadonlyMap<string, string>

export const NO_LOCKS: CommandLocks = new Map()

export function lockedCommand(
  command: string,
  lessonTitle: string,
  locks: CommandLocks,
): CommandOutput[] {
  const available = unlockedCommandNames(locks)
  const lines = [`${command} is taught in ${lessonTitle}.`]
  if (available.length > 0) lines.push(`Available now: ${available.join(', ')}`)
  return refuse(lines.join('\n'))
}
