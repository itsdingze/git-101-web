import { fail, say } from '@/lib/git-sim/output'
import type { GhCommandHandler } from '@/lib/git-sim/types'

const KNOWN_TOKEN_PREFIXES = ['github_pat_', 'ghp_', 'gho_']

const NOT_SIGNED_IN = 'You are not logged into any GitHub hosts. To log in, run: gh auth login'

function maskToken(token: string): string {
  const prefix = KNOWN_TOKEN_PREFIXES.find((candidate) => token.startsWith(candidate)) ?? ''
  return prefix + '*'.repeat(token.length - prefix.length)
}

export const authStatus: GhCommandHandler = (_args, ctx) => {
  const { account, token } = ctx.github
  if (!account || !token) return Promise.resolve(fail(NOT_SIGNED_IN))

  return Promise.resolve(
    say(
      [
        'github.com',
        `  ✓ Logged in to github.com account ${account} (keyring)`,
        '  - Active account: true',
        '  - Git operations protocol: https',
        `  - Token: ${maskToken(token)}`,
        "  - Token scopes: 'gist', 'read:org', 'repo'",
      ].join('\n'),
    ),
  )
}
