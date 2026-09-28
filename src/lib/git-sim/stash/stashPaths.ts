import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { matchAny, repoPrefix, specMatcher } from '@/lib/git-sim/fs/pathspec'
import { SandboxError } from '@/lib/git-sim/errors'
import type { CommandContext } from '@/lib/git-sim/types'

export type PathLimit = (path: string) => boolean

export async function stashPathLimit(
  ctx: CommandContext,
  dir: string,
  specs: readonly string[],
  untracked: readonly string[],
): Promise<PathLimit | null> {
  if (specs.length === 0) return null

  const prefix = repoPrefix(ctx, dir)
  const known = [...(await git.listFiles({ fs: gitFs(ctx.fs), dir })), ...untracked]
  const unknown = specs.find((spec) => !known.some(specMatcher(spec, prefix)))
  if (unknown !== undefined) {
    const depth = prefix === '' ? 0 : prefix.length + 1
    throw new SandboxError(
      `error: pathspec ':(prefix:${depth})${unknown}' did not match any file(s) known to git\nDid you forget to 'git add'?`,
    )
  }
  return matchAny(specs, prefix)
}
