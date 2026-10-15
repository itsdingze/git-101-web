import { say } from '@/lib/git-sim/output'
import type { CommandHandler } from '@/lib/git-sim/types'

export const echo: CommandHandler = (args) => Promise.resolve(say(args.join(' ')))
