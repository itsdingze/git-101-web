import { say } from '@/lib/git-sim/output'
import type { CommandHandler } from '@/lib/git-sim/types'

export const pwd: CommandHandler = (_args, ctx) => Promise.resolve(say(ctx.cwd))
