import type { FolderContents } from '@/lib/git-sim/fs/folderContents'
import { messages } from '@/messages/en'
import { failed, firstCapture, printed, type TipRule } from './tipRule'

const NOT_A_REPOSITORY = /^fatal: not a git repository/m
const COMMAND_NOT_FOUND = /^bash: \S+: command not found/m
const NO_SUCH_FILE = /No such file or directory/
const MISSING_NAME = /^(?:bash: )?(?:cd|cat): (.+): No such file or directory$/m
const TAUGHT_COMMANDS = new Set(['pwd', 'ls', 'cd', 'git', 'gh', 'help', 'clear'])
const tips = messages.sandbox.tips
const WINDOWS_COMMANDS: Readonly<Record<string, string>> = {
  dir: tips.windowsDir,
  cls: tips.windowsCls,
}

export const unknownCommandTip: TipRule = ({ tokens, outputs }) => {
  if (!printed(outputs, COMMAND_NOT_FOUND)) return null
  const name = tokens[0]?.raw ?? ''
  if (name === 'cd..') return tips.cdWithoutSpace
  const windows = WINDOWS_COMMANDS[name.toLowerCase()]
  if (windows) return windows
  const lower = name.toLowerCase()
  if (lower !== name && TAUGHT_COMMANDS.has(lower)) return tips.lowercaseCommand(lower)
  return null
}

function folderHolding(name: string, folder: FolderContents): string | null {
  if (name.includes('/')) return null
  const holders = folder.files.flatMap((path) => {
    const segments = path.split('/')
    const depth = segments.findIndex((segment, index) => index > 0 && segment === name)
    return depth === -1 ? [] : [segments.slice(0, depth)]
  })
  const [nearest] = holders.sort((a, b) => a.length - b.length)
  return nearest ? nearest.join('/') : null
}

export const missingNameTip: TipRule = ({ tokens, outputs, folder }) => {
  const command = tokens[0]?.text
  if ((command !== 'cd' && command !== 'cat') || !printed(outputs, NO_SUCH_FILE)) return null
  const name = firstCapture(outputs, MISSING_NAME)
  const holder = name ? folderHolding(name, folder) : null
  if (name && holder) return tips.insideFolder(name, holder)
  return tips.noSuchName
}

function holdsUntrackedProject(folder: FolderContents): boolean {
  const ownFiles = folder.files.filter((path) => !path.includes('/') && !path.startsWith('.'))
  return ownFiles.length > 0 && folder.repositories.length === 0
}

export const notARepositoryTip: TipRule = ({ outputs, folder }) => {
  if (!failed(outputs) || !printed(outputs, NOT_A_REPOSITORY)) return null
  if (holdsUntrackedProject(folder)) return tips.untrackedProject
  return tips.notARepository
}
