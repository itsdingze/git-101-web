import { add } from './add'
import { branch } from './branch'
import { checkout } from './checkout'
import { clone } from './clone'
import { commit } from './commit'
import { config } from './config'
import { diff } from './diff'
import { fetch } from './fetch'
import { init } from './init'
import { log } from './log'
import { merge } from './merge'
import { pull } from './pull'
import { push } from './push'
import { reflog } from './reflog'
import { remote } from './remote'
import { reset } from './reset'
import { restore } from './restore'
import { revert } from './revert'
import { rm } from './rm'
import { stash } from './stash'
import { status } from './status'
import { switchCommand } from './switch'
import type { GitSubcommand } from '@/lib/git-sim/types'

const SIMULATED_COMMANDS = {
  add,
  branch,
  checkout,
  clone,
  commit,
  config,
  diff,
  fetch,
  init,
  log,
  merge,
  pull,
  push,
  reflog,
  remote,
  reset,
  restore,
  revert,
  rm,
  stash,
  status,
  switch: switchCommand,
} satisfies Record<string, GitSubcommand>

export type GitCommandName = keyof typeof SIMULATED_COMMANDS

export const GIT_COMMANDS: Readonly<Record<string, GitSubcommand>> = SIMULATED_COMMANDS

/** Real commands the course mentions but this sandbox does not model. */
export const UNSIMULATED_GIT_COMMANDS = [
  'am',
  'apply',
  'archive',
  'bisect',
  'blame',
  'cherry-pick',
  'clean',
  'describe',
  'gc',
  'mv',
  'rebase',
  'shortlog',
  'show',
  'submodule',
  'tag',
  'worktree',
]
