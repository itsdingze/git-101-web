import { add } from './add'
import { branch } from './branch'
import { clone } from './clone'
import { commit } from './commit'
import { config } from './config'
import { diff } from './diff'
import { init } from './init'
import { log } from './log'
import { merge } from './merge'
import { pull } from './pull'
import { push } from './push'
import { remote } from './remote'
import { restore } from './restore'
import { rm } from './rm'
import { show } from './show'
import { stash } from './stash'
import { status } from './status'
import { switchCommand } from './switch'
import type { GitSubcommand } from '@/lib/git-sim/types'

const SIMULATED_COMMANDS = {
  add,
  branch,
  clone,
  commit,
  config,
  diff,
  init,
  log,
  merge,
  pull,
  push,
  remote,
  restore,
  rm,
  show,
  stash,
  status,
  switch: switchCommand,
} satisfies Record<string, GitSubcommand>

export type GitCommandName = keyof typeof SIMULATED_COMMANDS

export const GIT_COMMANDS: Readonly<Record<string, GitSubcommand>> = SIMULATED_COMMANDS

export const UNSIMULATED_GIT_COMMANDS = [
  'am',
  'apply',
  'archive',
  'bisect',
  'blame',
  'checkout',
  'cherry-pick',
  'clean',
  'describe',
  'fetch',
  'gc',
  'mv',
  'rebase',
  'reflog',
  'reset',
  'revert',
  'shortlog',
  'submodule',
  'tag',
  'worktree',
]
