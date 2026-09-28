import type { CommandLocks } from './commandLocks'

type UsageEntry = readonly [name: string, summary: string]

type UsageSection = {
  heading: string
  entries: readonly UsageEntry[]
}

const USAGE_SECTIONS: readonly UsageSection[] = [
  {
    heading: 'start a working area',
    entries: [
      ['init', 'create an empty Git repository'],
      ['config', 'set your name, email, or editor'],
    ],
  },
  {
    heading: 'work on the current change',
    entries: [
      ['add', 'add file contents to the staging area'],
      ['restore', 'restore working tree files'],
      ['reset', 'reset current HEAD to another state'],
      ['rm', 'remove files from the working tree and the index'],
      ['stash', 'shelve changes and restore a clean working tree'],
    ],
  },
  {
    heading: 'examine the history and state',
    entries: [
      ['status', 'show the working tree status'],
      ['diff', 'show changes between commits, commit and working tree, etc'],
      ['log', 'show commit logs'],
      ['reflog', 'show every place HEAD has been'],
    ],
  },
  {
    heading: 'grow, mark and tweak your common history',
    entries: [
      ['branch', 'list, create, or delete branches'],
      ['switch', 'switch branches'],
      ['checkout', 'switch branches or restore working tree files'],
      ['commit', 'record changes to the repository'],
      ['merge', 'join two or more development histories together'],
      ['revert', 'undo a commit by recording the opposite as a new commit'],
    ],
  },
  {
    heading: 'collaborate',
    entries: [
      ['clone', 'copy an existing repository into a new directory'],
      ['remote', 'manage set of tracked repositories'],
      ['fetch', 'download objects and refs from another repository'],
      ['pull', 'fetch from and integrate with another repository'],
      ['push', 'update remote refs along with associated objects'],
    ],
  },
]

export function unlockedCommandNames(locks: CommandLocks): string[] {
  return USAGE_SECTIONS.flatMap((section) => section.entries)
    .map(([name]) => name)
    .filter((name) => !locks.has(name))
}

function sectionLines(section: UsageSection, locks: CommandLocks): string[] {
  const entries = section.entries.filter(([name]) => !locks.has(name))
  if (entries.length === 0) return []

  return [
    '',
    `   ${section.heading}`,
    ...entries.map(([name, summary]) => `      ${name.padEnd(11)}${summary}`),
  ]
}

export function usageFor(locks: CommandLocks): string {
  const anyLocked = locks.size > 0

  return [
    'usage: git [-v | --version] [-h | --help] <command> [<args>]',
    '',
    anyLocked
      ? 'These are the Git commands available so far:'
      : 'These are the Git commands this practice sandbox understands:',
    ...USAGE_SECTIONS.flatMap((section) => sectionLines(section, locks)),
    ...(anyLocked ? ['', 'Later lessons add more commands.'] : []),
  ].join('\n')
}
