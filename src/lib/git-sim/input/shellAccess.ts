import { refuse } from '@/lib/git-sim/output'
import type { CommandLocks } from './commandLocks'
import type { CommandOutput } from '@/lib/git-sim/types'

export type ShellAccess = 'full' | 'navigation-only'

const LEARNER_COMMANDS = new Set(['pwd', 'ls', 'cd', 'help'])

function moveAroundOnly(locks: CommandLocks): string {
  const tools = locks.has('gh') ? 'Git' : 'Git and gh'
  return `This course uses the terminal only to move around with pwd, ls and cd, and to run ${tools}.`
}

export function shellCommandRefusal(name: string, access: ShellAccess, locks: CommandLocks): CommandOutput[] | null {
  if (access === 'full' || LEARNER_COMMANDS.has(name)) return null
  return refuse(`${name} isn't available here. ${moveAroundOnly(locks)}`)
}

export function outputRedirectionRefusal(access: ShellAccess, locks: CommandLocks): CommandOutput[] | null {
  if (access === 'full') return null
  return refuse(`Writing to a file with > isn't available here. ${moveAroundOnly(locks)}`)
}
