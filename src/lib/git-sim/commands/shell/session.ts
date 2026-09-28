import { say, silent } from '@/lib/git-sim/output'
import { unlockedCommandEntries } from '@/lib/git-sim/input/gitUsage'
import type { CommandLocks } from '@/lib/git-sim/input/commandLocks'
import type { CommandHandler } from '@/lib/git-sim/types'

export const clear: CommandHandler = () => Promise.resolve(silent)

type HelpEntry = readonly [name: string, summary: string]

const TAUGHT_SHELL_COMMANDS: readonly HelpEntry[] = [
  ['pwd', "show which folder you're in"],
  ['ls', "list what's in this folder"],
  ['cd', 'go into a folder, or back up with cd ..'],
  ['cat', "print what's in a file"],
  ['echo', 'print text, or write it into a file with >'],
]

function entryLines(entries: readonly HelpEntry[]): string[] {
  return entries.map(([name, summary]) => `  ${name.padEnd(10)}${summary}`)
}

function gitCommandLines(locks: CommandLocks): string[] {
  const unlocked = unlockedCommandEntries(locks)
  if (unlocked.length === 0) return ['No Git commands yet. Later lessons teach them.']
  if (locks.size === 0) return ['Git commands you know:', ...entryLines(unlocked)]
  return ['Git commands you know so far:', ...entryLines(unlocked), 'Later lessons add more commands.']
}

export const help: CommandHandler = (_args, _ctx, locks) =>
  Promise.resolve(
    say(
      [
        'This is a practice terminal. It works like a real one, but it runs in your browser with its own pretend files, so nothing here touches your computer.',
        '',
        'Commands you know so far:',
        ...entryLines(TAUGHT_SHELL_COMMANDS),
        '',
        ...gitCommandLines(locks),
        '',
        'To start this exercise over, press Start over below the terminal.',
      ].join('\n'),
    ),
  )
