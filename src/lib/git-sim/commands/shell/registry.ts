import { cd, pwd } from './navigation'
import { ls } from './listing'
import { cat, echo, touch } from './fileContents'
import { mkdir, mv, rm } from './fileTree'
import { clear, createHelp } from './session'
import type { CommandHandler } from '@/lib/git-sim/types'

const commands: Record<string, CommandHandler> = {
  cat,
  cd,
  clear,
  echo,
  ls,
  mkdir,
  mv,
  pwd,
  rm,
  touch,
}

commands.help = createHelp(Object.keys(commands))

export const SHELL_COMMANDS: Readonly<Record<string, CommandHandler>> = commands
