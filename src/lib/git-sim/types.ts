import type { ConfigEntry } from './config/configScope'
import type { SandboxFs } from './fs/sandboxFs'
import type { GitHubState } from './github/githubState'
import type { CommandLocks } from './input/commandLocks'

type CommandStream = 'stdout' | 'stderr'

export type CommandOutput = {
  text: string
  stream: CommandStream
  prose?: true
  unterminated?: true
}

export type UserIdentity = {
  name: string
  email: string
}

export type RemoteLink = {
  name: string
  url: string
  dir: string
}

export type CommandContext = {
  fs: SandboxFs
  root: string
  cwd: string
  remote: RemoteLink | null
  github: GitHubState
  globalConfig: ConfigEntry[]
  cutShortConfig: Set<string>
  previousBranch: string | null
  nextTimestamp: () => number
  moveTo: (absolutePath: string) => void
  rememberBranch: (branch: string | null) => void
}

export type CommandHandler = (
  args: readonly string[],
  ctx: CommandContext,
  locks: CommandLocks,
) => Promise<CommandOutput[]>

export type GitCommandHandler = (
  args: readonly string[],
  ctx: CommandContext,
  dir: string,
) => Promise<CommandOutput[]>

export type GhCommandHandler = (
  args: readonly string[],
  ctx: CommandContext,
  stdin: string,
) => Promise<CommandOutput[]>

export type GitSubcommand = {
  requiresRepo: boolean
  run: GitCommandHandler
}
