import { explain } from '@/lib/git-sim/output'
import type { CommandLocks } from '@/lib/git-sim/input/commandLocks'
import type { CommandHandler } from '@/lib/git-sim/types'

type HelpEntry = readonly [name: string, summary: string]

const TAUGHT_SHELL_COMMANDS: readonly HelpEntry[] = [
  ['pwd', "show which folder you're in"],
  ['ls', "list what's in this folder"],
  ['cd', 'go into a folder, or back up with cd ..'],
]

const TAUGHT_GIT_COMMANDS: readonly HelpEntry[] = [
  ['config', 'set a setting, like your name, or read one back'],
  ['init', 'turn this folder into a repository'],
  ['status', 'show what Git sees right now'],
  ['add', 'stage a file for your next commit'],
  ['commit', "record what's staged as a new commit"],
  ['rm', 'stop tracking a file, keeping it with --cached'],
  ['switch', 'move to another branch'],
  ['branch', 'list, create, or delete branches'],
  ['merge', "bring another branch's work into this one"],
  ['log', 'list your commits, newest first'],
  ['restore', "throw away changes you haven't committed"],
  ['show', 'show what one commit changed'],
  ['diff', 'show the lines you changed'],
  ['remote', 'list your remotes, or add one'],
  ['push', 'send your commits up to a remote'],
  ['clone', 'copy a project down from a remote'],
  ['pull', 'bring new commits down and merge them in'],
  ['stash', 'put unfinished changes on a shelf'],
]

const TAUGHT_GH_COMMANDS: readonly HelpEntry[] = [
  ['gh auth login', 'sign in to GitHub'],
  ['gh auth status', "check which account you're signed in with"],
  ['gh repo clone', 'copy a GitHub repository onto this computer'],
  ['gh pr create', 'open a pull request for this branch'],
  ['gh pr view', 'show a pull request and its review'],
  ['gh pr merge', 'merge a pull request on GitHub'],
]

function entryLines(entries: readonly HelpEntry[], width = 10): string[] {
  return entries.map(([name, summary]) => `  ${name.padEnd(width)}${summary}`)
}

function ghCommandLines(locks: CommandLocks): string[] {
  if (locks.has('gh')) return []
  return ['', 'GitHub commands you know:', ...entryLines(TAUGHT_GH_COMMANDS, 16)]
}

function gitCommandLines(locks: CommandLocks): string[] {
  const unlocked = TAUGHT_GIT_COMMANDS.filter(([name]) => !locks.has(name))
  if (unlocked.length === 0) return ['No Git commands yet. Later lessons teach them.']
  if (locks.size === 0) return ['Git commands you know:', ...entryLines(unlocked)]
  return ['Git commands you know so far:', ...entryLines(unlocked), 'Later lessons add more commands.']
}

export const help: CommandHandler = (_args, _ctx, locks) =>
  Promise.resolve(
    explain(
      [
        'This is a practice terminal. It works like a real one, but it runs in your browser with its own pretend files, so nothing here touches your computer.',
        '',
        'Terminal commands you know so far:',
        ...entryLines(TAUGHT_SHELL_COMMANDS),
        '',
        ...gitCommandLines(locks),
        ...ghCommandLines(locks),
        '',
        'To start this exercise over, press Start over below the terminal.',
      ].join('\n'),
    ),
  )
