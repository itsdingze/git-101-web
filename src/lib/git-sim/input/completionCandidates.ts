import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { isDirectory, listEntries } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import { findRepoDir } from '@/lib/git-sim/history/repository'
import { unlockedCommandNames } from './gitUsage'
import type { CommandLocks } from './commandLocks'
import type { CommandContext } from '@/lib/git-sim/types'

export type Candidate = {
  word: string
  label: string
  folder: boolean
}

type PathKind = 'any' | 'folders'

const PATH_SUBCOMMANDS = new Set(['add', 'restore', 'rm', 'diff', 'show'])
const BRANCH_SUBCOMMANDS = new Set(['switch', 'merge'])
const DELETE_FLAGS = new Set(['-d', '-D', '--delete'])

function named(word: string, names: readonly string[]): Candidate[] {
  return names.filter((name) => name.startsWith(word)).map((name) => ({ word: name, label: name, folder: false }))
}

async function pathCandidates(ctx: CommandContext, word: string, kind: PathKind): Promise<Candidate[]> {
  const slash = word.lastIndexOf('/')
  const folderPart = word.slice(0, slash + 1)
  const namePart = word.slice(slash + 1)
  const folder = resolvePath(folderPart || '.', ctx.cwd, ctx.root)
  if (!(await isDirectory(ctx.fs, folder))) return []

  const entries = await listEntries(ctx.fs, folder)
  return entries
    .filter(({ name, directory }) => name.startsWith(namePart) && (kind === 'any' || directory))
    .filter(({ name }) => namePart.startsWith('.') || !name.startsWith('.'))
    .map(({ name, directory }) => {
      const label = directory ? `${name}/` : name
      return { word: `${folderPart}${label}`, label, folder: directory }
    })
}

async function branchCandidates(ctx: CommandContext, word: string): Promise<Candidate[]> {
  const dir = await findRepoDir(ctx)
  if (!dir) return []
  return named(word, await git.listBranches({ fs: gitFs(ctx.fs), dir }))
}

function gitArgumentCandidates(ctx: CommandContext, args: readonly string[], word: string): Promise<Candidate[]> {
  const [subcommand = '', ...options] = args
  if (PATH_SUBCOMMANDS.has(subcommand)) return pathCandidates(ctx, word, 'any')
  if (BRANCH_SUBCOMMANDS.has(subcommand)) return branchCandidates(ctx, word)
  if (subcommand === 'branch' && options.some((option) => DELETE_FLAGS.has(option))) {
    return branchCandidates(ctx, word)
  }
  return Promise.resolve([])
}

export function completionCandidates(
  ctx: CommandContext,
  locks: CommandLocks,
  before: readonly string[],
  word: string,
): Promise<Candidate[]> {
  const [command, ...args] = before
  if (command === undefined || word.startsWith('-')) return Promise.resolve([])
  if (command === 'git' && args.length === 0) return Promise.resolve(named(word, unlockedCommandNames(locks).sort()))
  if (command === 'git') return gitArgumentCandidates(ctx, args, word)
  if (command === 'gh') return Promise.resolve([])
  return pathCandidates(ctx, word, command === 'cd' ? 'folders' : 'any')
}
