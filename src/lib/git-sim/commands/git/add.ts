import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { repoPrefix, specMatcher } from '@/lib/git-sim/pathspec'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { silent } from '@/lib/git-sim/output'
import { readWorkingTree } from '@/lib/git-sim/workingTree'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

type Candidate = { path: string; deleted: boolean }

const EVERYTHING_FLAGS = ['-A', '--all', '-u', '--update']

async function candidatesFor(ctx: CommandContext, dir: string): Promise<Candidate[]> {
  const tree = await readWorkingTree(ctx, dir)
  return [
    ...tree.unstaged.map((change) => ({ path: change.path, deleted: change.kind === 'deleted' })),
    ...tree.untracked.map((path) => ({ path, deleted: false })),
  ]
}

async function selectCandidates(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
): Promise<Candidate[]> {
  const candidates = await candidatesFor(ctx, dir)
  const specs = operandsOf(args)

  if (specs.length === 0) return candidates

  const prefix = repoPrefix(ctx, dir)
  const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const selected = new Map<string, Candidate>()

  for (const spec of specs) {
    const matches = specMatcher(spec, prefix)
    const hits = candidates.filter((candidate) => matches(candidate.path))
    if (hits.length === 0 && !tracked.some(matches)) {
      throw new SandboxError(`fatal: pathspec '${spec}' did not match any files`)
    }
    for (const hit of hits) selected.set(hit.path, hit)
  }

  return [...selected.values()]
}

export const add: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (operandsOf(args).length === 0 && !hasFlag(args, ...EVERYTHING_FLAGS)) {
      throw new SandboxError(
        "Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?",
      )
    }

    for (const { path, deleted } of await selectCandidates(ctx, dir, args)) {
      if (deleted) await git.remove({ fs: gitFs(ctx.fs), dir, filepath: path })
      else await git.add({ fs: gitFs(ctx.fs), dir, filepath: path })
    }

    return silent
  },
}
