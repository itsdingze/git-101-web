import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { isDirectory, pathExists, removeTree } from '@/lib/git-sim/fs/fileOperations'
import { repoPrefix, specMatcher, specTarget } from '@/lib/git-sim/fs/pathspec'
import { readStatusRows } from '@/lib/git-sim/working-tree/workingTree'
import { readUnmergedEntries } from '@/lib/git-sim/working-tree/indexStages'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

type Problem = 'both' | 'staged' | 'local'

function problemOf(head: number, workdir: number, stage: number, cachedOnly: boolean): Problem | null {
  if (stage === 3) return 'both'
  if (cachedOnly) return null
  if (stage === 2 && (head === 0 || workdir !== 1)) return 'staged'
  if (stage === 1 && workdir === 2) return 'local'
  return null
}

function problemReport(problem: Problem, paths: readonly string[]): string {
  const one = paths.length === 1
  const subject = one ? 'the following file has' : 'the following files have'
  const listed = paths.map((path) => `    ${path}`)
  if (problem === 'both') {
    return [`error: ${subject} staged content different from both the`, 'file and the HEAD:', ...listed, '(use -f to force removal)'].join('\n')
  }
  const what = problem === 'staged' ? 'changes staged in the index' : 'local modifications'
  return [`error: ${subject} ${what}:`, ...listed, '(use --cached to keep the file, or -f to force removal)'].join('\n')
}

async function refuseChangedFiles(
  ctx: CommandContext,
  dir: string,
  paths: ReadonlySet<string>,
  cachedOnly: boolean,
): Promise<void> {
  const found: Record<Problem, string[]> = { both: [], staged: [], local: [] }
  const unmerged = new Set((await readUnmergedEntries(ctx, dir)).map(({ path }) => path))
  for (const [path, head, workdir, stage] of await readStatusRows(ctx, dir)) {
    if (!paths.has(path) || unmerged.has(path) || workdir === 0) continue
    const problem = problemOf(head, workdir, stage, cachedOnly)
    if (problem) found[problem].push(path)
  }

  const reports = (['both', 'staged', 'local'] as const)
    .filter((problem) => found[problem].length > 0)
    .map((problem) => problemReport(problem, found[problem]))
  if (reports.length > 0) throw new SandboxError(reports.join('\n'))
}

function isInsideFolder(path: string, folder: string): boolean {
  return folder === '' || path.startsWith(`${folder}/`)
}

export const rm: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const specs = operandsOf(args)
    if (specs.length === 0) throw new SandboxError('fatal: No pathspec was given. Which files should I remove?')

    const recursive = hasFlag(args, '-r', '-R', '--recursive')
    const cachedOnly = hasFlag(args, '--cached')
    const prefix = repoPrefix(ctx, dir)
    const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
    const removed: string[] = []

    for (const spec of specs) {
      const matches = specMatcher(spec, prefix)
      const hits = tracked.filter(matches)
      if (hits.length === 0) {
        throw new SandboxError(`fatal: pathspec '${spec}' did not match any files`)
      }
      const folder = specTarget(spec, prefix) ?? ''
      if (!recursive && hits.some((hit) => isInsideFolder(hit, folder))) {
        throw new SandboxError(`fatal: not removing '${spec}' recursively without -r`)
      }
      removed.push(...hits)
    }

    if (!hasFlag(args, '-f', '--force')) await refuseChangedFiles(ctx, dir, new Set(removed), cachedOnly)

    for (const path of new Set(removed)) {
      await git.remove({ fs: gitFs(ctx.fs), dir, filepath: path })
      if (cachedOnly) continue

      const absolute = joinPath(dir, path)
      if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
      await pruneEmptyFolders(ctx, dir, path)
    }

    if (hasFlag(args, '-q', '--quiet')) return silent
    const cleanup = [...new Set(removed)].map((path) => `rm '${path}'`)
    return say(cleanup.join('\n'))
  },
}

async function pruneEmptyFolders(ctx: CommandContext, dir: string, path: string): Promise<void> {
  const parts = path.split('/').slice(0, -1)
  for (let depth = parts.length; depth > 0; depth -= 1) {
    const folder = joinPath(dir, parts.slice(0, depth).join('/'))
    if (!(await isDirectory(ctx.fs, folder))) return
    if ((await ctx.fs.promises.readdir(folder)).length > 0) return
    await ctx.fs.promises.rmdir(folder)
  }
}
