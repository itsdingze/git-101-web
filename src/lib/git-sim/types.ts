import type { SandboxFs } from './fs/sandboxFs'

export type CommandStream = 'stdout' | 'stderr'

export type CommandOutput = {
  text: string
  stream: CommandStream
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
  globalConfig: Map<string, string>
  previousBranch: string | null
  nextTimestamp: () => number
  moveTo: (absolutePath: string) => void
  rememberBranch: (branch: string | null) => void
}

export type CommandHandler = (
  args: readonly string[],
  ctx: CommandContext,
  locks: ReadonlyMap<string, string>,
) => Promise<CommandOutput[]>

export type GitCommandHandler = (
  args: readonly string[],
  ctx: CommandContext,
  dir: string,
) => Promise<CommandOutput[]>

export type GitSubcommand = {
  requiresRepo: boolean
  run: GitCommandHandler
}
