import { readIgnoredEntries } from '@/lib/git-sim/fs/ignoredPaths'
import { collapseBoundaryFor, matchAny, repoPrefix } from '@/lib/git-sim/fs/pathspec'
import { CourseExplanationError, SandboxError } from '@/lib/git-sim/errors'
import type { CommandLine, KnownOptions } from '@/lib/git-sim/input/commandLine'
import { say, silent, stdout } from '@/lib/git-sim/output'
import { formatShortStatus, type ShortFormat } from '@/lib/git-sim/working-tree/shortStatus'
import { formatStatus } from '@/lib/git-sim/working-tree/longStatus'
import type { StatusView, UntrackedFilesMode } from '@/lib/git-sim/working-tree/statusView'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const STATUS_OPTIONS: KnownOptions = {
  flags: ['-s', '--short', '--long', '--ignored', '-z', '-b', '--branch'],
  attachedValueFlags: ['--porcelain', '-u', '--untracked-files'],
}

const UNTRACKED_FLAGS = ['-u', '--untracked-files']

const UNSIMULATED_PORCELAIN = "This practice terminal doesn't simulate --porcelain=v2 for git status. Check the spelling, or run the command without it."

function untrackedFilesMode(line: CommandLine): UntrackedFilesMode {
  if (!line.has(...UNTRACKED_FLAGS)) return 'normal'

  const value = line.value(...UNTRACKED_FLAGS) ?? 'all'
  if (value === 'no' || value === 'normal' || value === 'all') return value
  throw new SandboxError(`fatal: Invalid untracked files mode '${value}'`)
}

function refuseOtherPorcelainVersions(line: CommandLine): void {
  const version = line.value('--porcelain')
  if (version === undefined || version === 'v1' || version === '1') return
  if (version === 'v2' || version === '2') throw new CourseExplanationError(UNSIMULATED_PORCELAIN)
  throw new SandboxError(`fatal: unsupported porcelain version '${version}'`)
}

async function statusView(ctx: CommandContext, dir: string, line: CommandLine): Promise<StatusView> {
  const specs = line.operands
  const prefix = repoPrefix(ctx, dir)
  const untrackedFiles = untrackedFilesMode(line)
  const showsIgnored = line.has('--ignored') && untrackedFiles !== 'no'
  return {
    ignoredEntries: showsIgnored ? await readIgnoredEntries(ctx, dir, untrackedFiles === 'all') : [],
    inScope: specs.length === 0 ? () => true : matchAny(specs, prefix),
    collapseBoundary: collapseBoundaryFor(specs, prefix),
    untrackedFiles,
  }
}

function shortFormatOf(line: CommandLine): ShortFormat | null {
  const chosen = line.lastOf('-s', '--short', '--long', '--porcelain')
  const nulTerminated = line.has('-z')
  if (chosen === '--long' && nulTerminated) throw new SandboxError("fatal: options '--long' and '-z' cannot be used together")
  if (chosen === '--long' || (!chosen && !nulTerminated)) return null
  return {
    rootRelative: chosen === '--porcelain' || nulTerminated,
    showBranch: line.has('-b', '--branch'),
    separator: nulTerminated ? '\0' : '\n',
  }
}

function shortOutput(text: string, format: ShortFormat): CommandOutput[] {
  if (!text) return silent
  return format.separator === '\0' ? [{ ...stdout(text), unterminated: true }] : say(text)
}

export const status: GitSubcommand = {
  requiresRepo: true,
  options: STATUS_OPTIONS,
  run: async (line, ctx, dir) => {
    refuseOtherPorcelainVersions(line)
    const view = await statusView(ctx, dir, line)
    const format = shortFormatOf(line)
    if (format) return shortOutput(await formatShortStatus(ctx, dir, view, format), format)
    return say(await formatStatus(ctx, dir, view))
  },
}
