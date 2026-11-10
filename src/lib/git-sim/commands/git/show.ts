import git from 'isomorphic-git'
import type { ReadCommitResult } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import type { CommandLine, KnownOptions } from '@/lib/git-sim/input/commandLine'
import { say, silent, stdout } from '@/lib/git-sim/output'
import { matchAny, repoPrefix, specTarget } from '@/lib/git-sim/fs/pathspec'
import { pathExists } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import { commitNameLines, commitPatchLines, commitStatLines, mergeCommitDiffLines, mergeCommitNameLines, type PathScope } from '@/lib/git-sim/history/commitChanges'
import { commitBlock, commitFormatOf, commitHeaderLines, separatedByBlank } from '@/lib/git-sim/history/commitFormat'
import { readCommitFiles, readIndexFiles } from '@/lib/git-sim/working-tree/treeContents'
import { currentBranch, headOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { readShallowBoundary, withoutHiddenParents } from '@/lib/git-sim/history/shallowBoundary'
import { readDecorations } from '@/lib/git-sim/history/decorations'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const SHOW_OPTIONS: KnownOptions = {
  flags: ['--stat', '-p', '--patch', '-s', '--no-patch', '--name-only', '--oneline'],
  attachedValueFlags: ['--format', '--pretty'],
  singleLetterOnly: true,
}

async function requireCommit(ctx: CommandContext, dir: string, spec: string): Promise<ReadCommitResult> {
  if (!(await headOid(ctx, dir))) {
    const branch = (await currentBranch(ctx, dir)) ?? 'main'
    throw new SandboxError(`fatal: your current branch '${branch}' does not have any commits yet`)
  }

  const oid = await resolveCommitish(ctx, dir, spec)
  if (!oid) {
    throw new SandboxError(
      `fatal: ambiguous argument '${spec}': unknown revision or path not in the working tree.`,
    )
  }
  return withoutHiddenParents(await git.readCommit({ fs: gitFs(ctx.fs), dir, oid }), await readShallowBoundary(ctx, dir))
}

async function changeSections(ctx: CommandContext, dir: string, entry: ReadCommitResult, line: CommandLine, inScope: PathScope): Promise<string[][]> {
  if (line.has('-s', '--no-patch')) return []

  const merge = entry.commit.parent.length > 1
  if (line.has('--name-only')) return [merge ? await mergeCommitNameLines(ctx, dir, entry, inScope) : await commitNameLines(ctx, dir, entry, inScope)]

  const patch = async () => (merge ? mergeCommitDiffLines(ctx, dir, entry, inScope) : commitPatchLines(ctx, dir, entry, inScope))
  if (!line.has('--stat')) return [await patch()]

  const stat = await commitStatLines(ctx, dir, entry, inScope)
  return line.has('-p', '--patch') ? [stat, await patch()] : [stat]
}

type ShowOperands = { specs: string[]; paths: string[] }

async function isRevision(ctx: CommandContext, dir: string, operand: string): Promise<boolean> {
  return operand.includes(':') || (await resolveCommitish(ctx, dir, operand)) !== null
}

async function showOperands(ctx: CommandContext, dir: string, line: CommandLine): Promise<ShowOperands> {
  const specs: string[] = []
  const paths: string[] = []
  for (const operand of line.beforeDashes) {
    const namesFile = !(await isRevision(ctx, dir, operand)) && (await pathExists(ctx.fs, resolvePath(operand, ctx.cwd, ctx.root)))
    if (namesFile) paths.push(operand)
    else specs.push(operand)
  }
  return { specs: specs.length > 0 ? specs : ['HEAD'], paths: [...paths, ...line.afterDashes] }
}

async function showCommit(ctx: CommandContext, dir: string, spec: string, line: CommandLine, inScope: PathScope): Promise<CommandOutput[]> {
  const format = commitFormatOf(line)
  const entry = await requireCommit(ctx, dir, spec)
  const header = commitHeaderLines(entry, format, await readDecorations(ctx, dir))
  const sections = await changeSections(ctx, dir, entry, line, inScope)
  const text = commitBlock(header, sections, format, entry.commit.parent.length > 1).join('\n').trimEnd()
  return text ? say(text) : silent
}

function blobOutput(contents: string): CommandOutput[] {
  return contents.endsWith('\n') ? say(contents.slice(0, -1)) : [{ ...stdout(contents), unterminated: true }]
}

async function filesAtRevision(ctx: CommandContext, dir: string, revision: string): Promise<Map<string, string>> {
  if (revision === '') return readIndexFiles(ctx, dir)

  const oid = await resolveCommitish(ctx, dir, revision)
  if (!oid) throw new SandboxError(`fatal: invalid object name '${revision}'.`)
  return readCommitFiles(ctx, dir, oid)
}

function treePathFor(ctx: CommandContext, dir: string, typed: string): string {
  if (!typed.startsWith('./') && !typed.startsWith('../') && typed !== '.' && typed !== '..') return typed
  return specTarget(typed, repoPrefix(ctx, dir)) ?? typed
}

function listTreeEntries(files: ReadonlyMap<string, string>, folder: string): string[] {
  const names = new Set<string>()
  for (const path of files.keys()) {
    if (!path.startsWith(folder)) continue
    const rest = path.slice(folder.length)
    const slash = rest.indexOf('/')
    names.add(slash === -1 ? rest : rest.slice(0, slash + 1))
  }
  return [...names].sort()
}

function missingPathError(ctx: CommandContext, dir: string, files: ReadonlyMap<string, string>, path: string, revision: string): SandboxError {
  const full = specTarget(path, repoPrefix(ctx, dir))
  if (full && files.has(full) && full !== path) {
    return new SandboxError(
      [`fatal: path '${full}' exists, but not '${path}'`, `hint: Did you mean '${revision}:${full}' aka '${revision}:./${path}'?`].join('\n'),
    )
  }
  return new SandboxError(`fatal: path '${path}' does not exist in '${revision}'`)
}

async function showObjectAtPath(ctx: CommandContext, dir: string, spec: string): Promise<CommandOutput[]> {
  const colon = spec.indexOf(':')
  const revision = spec.slice(0, colon)
  const files = await filesAtRevision(ctx, dir, revision)
  const path = treePathFor(ctx, dir, spec.slice(colon + 1))

  const contents = files.get(path)
  if (contents !== undefined) return blobOutput(contents)

  const folder = path === '' ? '' : `${path}/`
  const entries = listTreeEntries(files, folder)
  if (entries.length === 0) throw missingPathError(ctx, dir, files, path, revision)
  return say([`tree ${spec}`, '', ...entries].join('\n'))
}

export const show: GitSubcommand = {
  requiresRepo: true,
  options: SHOW_OPTIONS,
  run: async (line, ctx, dir) => {
    const { specs, paths } = await showOperands(ctx, dir, line)
    const inScope: PathScope = paths.length === 0 ? () => true : matchAny(paths, repoPrefix(ctx, dir))
    const blankBetween = separatedByBlank(commitFormatOf(line))

    const outputs: CommandOutput[] = []
    let previousWasCommit = false
    for (const spec of specs) {
      const isObject = spec.includes(':')
      const shown = isObject ? await showObjectAtPath(ctx, dir, spec) : await showCommit(ctx, dir, spec, line, inScope)
      if (blankBetween && previousWasCommit && !isObject && shown.length > 0) outputs.push(stdout(''))
      outputs.push(...shown)
      previousWasCommit = !isObject
    }
    return outputs
  },
}
