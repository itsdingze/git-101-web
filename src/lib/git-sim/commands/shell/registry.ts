import { cd, pwd } from './navigation'
import { ls } from './listing'
import { cat, echo, touch } from './fileContents'
import { mkdir, mv, rm } from './fileTree'
import { clear, help } from './session'
import type { CommandHandler } from '@/lib/git-sim/types'

export const SHELL_COMMANDS: Readonly<Record<string, CommandHandler>> = {
  cat,
  cd,
  clear,
  echo,
  help,
  ls,
  mkdir,
  mv,
  pwd,
  rm,
  touch,
}
