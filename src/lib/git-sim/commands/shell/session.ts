import { say, silent } from '@/lib/git-sim/output'
import { GIT_COMMANDS } from '@/lib/git-sim/commands/git/registry'
import type { CommandHandler } from '@/lib/git-sim/types'

export const clear: CommandHandler = () => Promise.resolve(silent)

export function createHelp(shellCommands: readonly string[]): CommandHandler {
  return () =>
    Promise.resolve(
      say(
        [
          'This is a practice sandbox with its own tiny filesystem. Nothing here touches your computer.',
          '',
          'Git commands it understands:',
          `  ${Object.keys(GIT_COMMANDS).sort().join('  ')}`,
          '',
          'Shell commands it understands:',
          `  ${[...shellCommands].sort().join('  ')}`,
          '',
          'Anything else answers the way a real shell would. Use the reset button to start over.',
        ].join('\n'),
      ),
    )
}
