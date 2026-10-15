import { clone } from '@/lib/git-sim/commands/git/clone'
import { fail } from '@/lib/git-sim/output'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { hostedRemoteAt } from '@/lib/git-sim/remote/remoteConnection'
import { repositoryAddress } from '@/lib/git-sim/github/hostedRepository'
import type { CommandContext, GhCommandHandler } from '@/lib/git-sim/types'

function fullNameOf(ctx: CommandContext, repository: string): string {
  return repository.includes('/') ? repository : `${ctx.github.account ?? ''}/${repository}`
}

export const repoClone: GhCommandHandler = async (args, ctx) => {
  const [repository, directory] = operandsOf(args)
  if (!repository) return fail('cannot clone: repository argument required')

  const fullName = fullNameOf(ctx, repository)
  const address = repositoryAddress(fullName)
  if (!hostedRemoteAt(ctx, address)) {
    return fail(`GraphQL: Could not resolve to a Repository with the name '${fullName}'. (repository)`)
  }

  return clone.run(directory ? [address, directory] : [address], ctx, ctx.cwd)
}
