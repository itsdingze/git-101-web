import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { refuseOutsideRepository, repoPrefix, specMatcher } from '@/lib/git-sim/fs/pathspec'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { fail, silent } from '@/lib/git-sim/output'
import { readIgnoredFiles } from '@/lib/git-sim/fs/ignoredPaths'
import { readWorkingTree } from '@/lib/git-sim/working-tree/workingTree'
import { readUnmergedEntries } from '@/lib/git-sim/working-tree/indexStages'
import { pathExists } from '@/lib/git-sim/fs/fileOperations'
import { joinPath, resolvePath } from '@/lib/git-sim/fs/paths'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

type Candidate = { path: string; deleted: boolean }

const UPDATE_FLAGS = ['-u', '--update']
const EVERYTHING_FLAGS = ['-A', '--all', ...UPDATE_FLAGS]
const FORCE_FLAGS = ['-f', '--force']

async function candidatesFor(
  ctx: CommandContext,
  dir: string,
  forced: boolean,
  trackedOnly: boolean,
): Promise<Candidate[]> {
  const tree = await readWorkingTree(ctx, dir)
  const changed = [
    ...tree.unstaged.map((change) => ({ path: change.path, deleted: change.kind === 'deleted' })),
    ...(trackedOnly ? [] : tree.untracked.map((path) => ({ path, deleted: false }))),
  ]
  const unmerged: Candidate[] = []
  for (const { path } of await readUnmergedEntries(ctx, dir)) {
    if (changed.some((candidate) => candidate.path === path)) continue
    unmerged.push({ path, deleted: !(await pathExists(ctx.fs, joinPath(dir, path))) })
  }
  const candidates = [...changed, ...unmerged]
  if (!forced || trackedOnly) return candidates

  const ignored = await readIgnoredFiles(ctx, dir)
  return [...candidates, ...ignored.map((path) => ({ path, deleted: false }))]
}

type Selection = { candidates: Candidate[]; ignoredSpecs: string[] }

function ignoredPathsReport(specs: readonly string[]): CommandOutput[] {
  return fail(
    [
      'The following paths are ignored by one of your .gitignore files:',
      ...specs,
      'hint: Use -f if you really want to add them.',
      'hint: Turn this message off by running',
      'hint: "git config advice.addIgnoredFile false"',
    ].join('\n'),
  )
}

async function unknownToGitError(ctx: CommandContext, spec: string): Promise<SandboxError> {
  if (await pathExists(ctx.fs, resolvePath(spec, ctx.cwd, ctx.root))) {
    return new SandboxError(`error: pathspec '${spec}' did not match any file(s) known to git`)
  }
  return new SandboxError(`fatal: pathspec '${spec}' did not match any files`)
}

async function selectCandidates(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
): Promise<Selection> {
  const forced = hasFlag(args, ...FORCE_FLAGS)
  const trackedOnly = hasFlag(args, ...UPDATE_FLAGS)
  const candidates = await candidatesFor(ctx, dir, forced, trackedOnly)
  const specs = operandsOf(args)

  if (specs.length === 0) return { candidates, ignoredSpecs: [] }

  const prefix = repoPrefix(ctx, dir)
  const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const ignored = forced ? [] : await readIgnoredFiles(ctx, dir)
  const selected = new Map<string, Candidate>()
  const ignoredSpecs: string[] = []

  for (const spec of specs) {
    refuseOutsideRepository(spec, prefix, dir)
    const matches = specMatcher(spec, prefix)
    const hits = candidates.filter((candidate) => matches(candidate.path))
    for (const hit of hits) selected.set(hit.path, hit)
    if (hits.length > 0 || tracked.some(matches)) continue
    if (trackedOnly) throw await unknownToGitError(ctx, spec)
    if (!ignored.some(matches)) throw new SandboxError(`fatal: pathspec '${spec}' did not match any files`)
    ignoredSpecs.push(spec)
  }

  return { candidates: [...selected.values()], ignoredSpecs }
}

export const add: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (operandsOf(args).length === 0 && !hasFlag(args, ...EVERYTHING_FLAGS)) {
      throw new SandboxError(
        "Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?",
      )
    }

    const { candidates, ignoredSpecs } = await selectCandidates(ctx, dir, args)
    for (const { path, deleted } of candidates) {
      if (deleted) {
        await git.remove({ fs: gitFs(ctx.fs), dir, filepath: path })
        continue
      }
      // isomorphic-git's add drops any path matching .gitignore, even one already in the index.
      await git.add({ fs: gitFs(ctx.fs), dir, filepath: path, force: true })
    }

    return ignoredSpecs.length > 0 ? ignoredPathsReport(ignoredSpecs) : silent
  },
}
