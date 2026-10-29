import { say, stdout } from '@/lib/git-sim/output'
import type { CommandHandler } from '@/lib/git-sim/types'

const NO_NEWLINE = /^-n+$/

export const echo: CommandHandler = (args) => {
  const textStart = args.findIndex((arg) => !NO_NEWLINE.test(arg))
  const optionCount = textStart === -1 ? args.length : textStart
  const text = args.slice(optionCount).join(' ')
  if (optionCount === 0) return Promise.resolve(say(text))

  return Promise.resolve([{ ...stdout(text), unterminated: true }])
}
