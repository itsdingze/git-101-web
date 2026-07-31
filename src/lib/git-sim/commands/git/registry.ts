import { add } from './add'
import { branch } from './branch'
import { checkout } from './checkout'
import { commit } from './commit'
import { config } from './config'
import { diff } from './diff'
import { fetch } from './fetch'
import { init } from './init'
import { log } from './log'
import { merge } from './merge'
import { pull } from './pull'
import { push } from './push'
import { remote } from './remote'
import { reset } from './reset'
import { restore } from './restore'
import { rm } from './rm'
import { status } from './status'
import { switchCommand } from './switch'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const GIT_COMMANDS: Record<string, GitSubcommand> = {
  add,
  branch,
  checkout,
  commit,
  config,
  diff,
  fetch,
  init,
  log,
  merge,
  pull,
  push,
  remote,
  reset,
  restore,
  rm,
  status,
  switch: switchCommand,
}

/** Real commands the course mentions but this sandbox does not model. */
export const UNSIMULATED_GIT_COMMANDS = [
  'am',
  'apply',
  'archive',
  'bisect',
  'blame',
  'cherry-pick',
  'clean',
  'clone',
  'describe',
  'gc',
  'mv',
  'rebase',
  'reflog',
  'revert',
  'shortlog',
  'show',
  'stash',
  'submodule',
  'tag',
  'worktree',
]
