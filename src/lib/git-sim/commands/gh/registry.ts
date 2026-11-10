import { authLogin } from './authLogin'
import { authStatus } from './authStatus'
import { repoClone } from './repoClone'
import { prCreate } from './prCreate'
import { prView } from './prView'
import { prMerge } from './prMerge'
import type { GhCommandHandler } from '@/lib/git-sim/types'

export const GH_COMMANDS: Readonly<Record<string, Readonly<Record<string, GhCommandHandler>>>> = {
  auth: { login: authLogin, status: authStatus },
  repo: { clone: repoClone },
  pr: { create: prCreate, view: prView, merge: prMerge },
}

export const UNSIMULATED_GH_COMMANDS: Readonly<Record<string, readonly string[]>> = {
  auth: ['logout', 'refresh', 'setup-git', 'switch', 'token'],
  pr: ['checkout', 'checks', 'close', 'comment', 'diff', 'edit', 'list', 'lock', 'ready', 'reopen', 'review', 'status', 'unlock'],
  repo: ['archive', 'create', 'delete', 'deploy-key', 'edit', 'fork', 'list', 'rename', 'set-default', 'sync', 'unarchive', 'view'],
}

export const UNSIMULATED_GH_GROUPS: readonly string[] = [
  'agent-task',
  'alias',
  'api',
  'attestation',
  'browse',
  'cache',
  'codespace',
  'config',
  'extension',
  'gist',
  'gpg-key',
  'issue',
  'label',
  'org',
  'project',
  'release',
  'ruleset',
  'run',
  'search',
  'secret',
  'ssh-key',
  'status',
  'variable',
  'workflow',
]
