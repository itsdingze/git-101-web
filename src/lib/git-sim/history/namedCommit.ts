import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { parseLine } from '@/lib/git-sim/input/tokenize'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { findRepoDir } from './repository'
import { resolveCommitish } from './resolveCommitish'
import type { CommandContext } from '@/lib/git-sim/types'

async function commitMessageAt(ctx: CommandContext, dir: string, spec: string): Promise<string | null> {
  try {
    const oid = await resolveCommitish(ctx, dir, spec)
    if (!oid) return null
    return (await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })).commit.message.trim()
  } catch {
    return null
  }
}

export async function namedCommitMessage(ctx: CommandContext, line: string): Promise<string | null> {
  const [program, , ...args] = parseLine(line).tokens
  const dir = program === 'git' ? await findRepoDir(ctx) : null
  if (!dir) return null

  for (const operand of operandsOf(args)) {
    const message = await commitMessageAt(ctx, dir, operand)
    if (message !== null) return message
  }
  return null
}
