import { fail, refuse, silent } from '@/lib/git-sim/output'
import { PRACTICE_ACCOUNT } from '@/lib/git-sim/github/githubState'
import type { GhCommandHandler } from '@/lib/git-sim/types'

const ACCEPTED_TOKEN = /^(ghp_|gho_|github_pat_)\w+$/

const USE_THE_TOKEN_FILE = 'gh auth login --with-token < ~/token.txt'

const NO_BROWSER = `This practice terminal can't open a browser to sign you in. Sign in with the practice token instead: ${USE_THE_TOKEN_FILE}`

const NO_TYPED_TOKEN = `This practice terminal can't wait for you to paste a token. Read it from the file instead: ${USE_THE_TOKEN_FILE}`

const BAD_CREDENTIALS = 'error validating token: HTTP 401: Bad credentials (https://api.github.com/)'

export const authLogin: GhCommandHandler = (args, ctx, stdin) => {
  if (!args.includes('--with-token')) return Promise.resolve(refuse(NO_BROWSER))
  if (stdin === '') return Promise.resolve(refuse(NO_TYPED_TOKEN))

  const token = stdin.trim()
  if (!ACCEPTED_TOKEN.test(token)) return Promise.resolve(fail(BAD_CREDENTIALS))

  ctx.github.account = PRACTICE_ACCOUNT
  ctx.github.token = token
  return Promise.resolve(silent)
}
