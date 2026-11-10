import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { currentBranch, refOid } from '@/lib/git-sim/history/repository'
import { clearUpstream, localUpstream, readUpstream, remoteBranchNamed, remoteRefOf, setUpstream, type Upstream } from '@/lib/git-sim/remote/upstream'
import type { CommandContext, CommandOutput } from '@/lib/git-sim/types'

const NO_SUCH_UPSTREAM_HINTS = [
  'hint:',
  'hint: If you are planning on basing your work on an upstream',
  'hint: branch that already exists at the remote, you may need to',
  'hint: run "git fetch" to retrieve it.',
  'hint:',
  'hint: If you are planning to push out a new local branch that',
  'hint: will track its remote counterpart, you may want to use',
  'hint: "git push -u" to set the upstream config as you push.',
]

async function namedOrCurrent(ctx: CommandContext, dir: string, named: string | undefined): Promise<string> {
  const branch = named ?? (await currentBranch(ctx, dir))
  if (!branch) throw new SandboxError('fatal: HEAD does not point to a branch')
  if (!(await refOid(ctx, dir, `refs/heads/${branch}`))) throw new SandboxError(`fatal: branch '${branch}' does not exist`)
  return branch
}

async function upstreamNamed(ctx: CommandContext, dir: string, spec: string): Promise<Upstream> {
  const remote = await remoteBranchNamed(ctx, dir, spec)
  if (remote) return remote
  if (await refOid(ctx, dir, `refs/heads/${spec}`)) return localUpstream(spec)

  throw new SandboxError([`fatal: the requested upstream branch '${spec}' does not exist`, ...NO_SUCH_UPSTREAM_HINTS].join('\n'))
}

export async function setBranchUpstream(
  ctx: CommandContext,
  dir: string,
  spec: string,
  named: string | undefined,
): Promise<CommandOutput[]> {
  const branch = await namedOrCurrent(ctx, dir, named)
  const upstream = await upstreamNamed(ctx, dir, spec)
  await setUpstream(ctx, dir, branch, upstream)
  return say(`branch '${branch}' set up to track '${remoteRefOf(upstream)}'.`)
}

export async function unsetBranchUpstream(
  ctx: CommandContext,
  dir: string,
  named: string | undefined,
): Promise<CommandOutput[]> {
  const branch = await namedOrCurrent(ctx, dir, named)
  if (!(await readUpstream(ctx, dir, branch))) {
    throw new SandboxError(`fatal: branch '${branch}' has no upstream information`)
  }
  await clearUpstream(ctx, dir, branch)
  return silent
}
