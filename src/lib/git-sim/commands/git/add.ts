import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { refuseOutsideRepository, repoPrefix, specMatcher } from '@/lib/git-sim/fs/pathspec'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { SandboxError } from '@/lib/git-sim/errors'
import { fail, say, silent } from '@/lib/git-sim/output'
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
const DRY_RUN_FLAGS = ['-n', '--dry-run']

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

function dryRunReport(candidates: readonly Candidate[], ignoredSpecs: readonly string[]): CommandOutput[] {
  const lines = [...candidates]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map(({ path, deleted }) => `${deleted ? 'remove' : 'add'} '${path}'`)
  const report = lines.length > 0 ? say(lines.join('\n')) : silent
  return ignoredSpecs.length > 0 ? [...report, ...ignoredPathsReport(ignoredSpecs)] : report
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
  line: CommandLine,
): Promise<Selection> {
  const forced = line.has(...FORCE_FLAGS)
  const trackedOnly = line.has(...UPDATE_FLAGS)
  const candidates = await candidatesFor(ctx, dir, forced, trackedOnly)
  const specs = line.operands

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
  options: { flags: [...EVERYTHING_FLAGS, ...FORCE_FLAGS, ...DRY_RUN_FLAGS] },
  run: async (line, ctx, dir) => {
    if (line.operands.length === 0 && !line.has(...EVERYTHING_FLAGS)) {
      throw new SandboxError(
        "Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?",
      )
    }

    const { candidates, ignoredSpecs } = await selectCandidates(ctx, dir, line)
    if (line.has(...DRY_RUN_FLAGS)) return dryRunReport(candidates, ignoredSpecs)

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
