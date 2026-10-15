import { cat } from './cat'
import { cd } from './cd'
import { echo } from './echo'
import { help } from './help'
import { ls } from './ls'
import { mkdir } from './mkdir'
import { mv } from './mv'
import { pwd } from './pwd'
import { rm } from './rm'
import { touch } from './touch'
import type { CommandHandler } from '@/lib/git-sim/types'

export const SHELL_COMMANDS: Readonly<Record<string, CommandHandler>> = {
  cat,
  cd,
  echo,
  help,
  ls,
  mkdir,
  mv,
  pwd,
  rm,
  touch,
}
