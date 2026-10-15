import type { FolderContents } from '@/lib/git-sim/fs/folderContents'
import { failed, firstCapture, printed, type TipRule } from './tipRule'

const NOT_A_REPOSITORY = /^fatal: not a git repository/m
const COMMAND_NOT_FOUND = /^bash: \S+: command not found/m
const NO_SUCH_FILE = /No such file or directory/
const MISSING_NAME = /^(?:bash: )?(?:cd|cat): (.+): No such file or directory$/m
const TAUGHT_COMMANDS = new Set(['pwd', 'ls', 'cd', 'git', 'gh', 'help', 'clear'])
const WINDOWS_COMMANDS: Readonly<Record<string, string>> = {
  dir: '`dir` is a Windows command. In this terminal, `ls` lists a folder.',
  cls: '`cls` is a Windows command. In this terminal, `clear` empties the screen.',
}

export const unknownCommandTip: TipRule = ({ tokens, outputs }) => {
  if (!printed(outputs, COMMAND_NOT_FOUND)) return null
  const name = tokens[0]?.raw ?? ''
  if (name === 'cd..') return 'Put a space between `cd` and `..`: `cd ..`'
  const windows = WINDOWS_COMMANDS[name.toLowerCase()]
  if (windows) return windows
  const lower = name.toLowerCase()
  if (lower !== name && TAUGHT_COMMANDS.has(lower)) return `Commands are lowercase. Try \`${lower}\`.`
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
  if (holder) return `\`${name}\` is inside \`${holder}\`. Run \`cd ${holder}\` first.`
  return "Nothing in this folder has that exact name. Run `ls` to see what's here, and type names exactly, capitals included."
}

function holdsUntrackedProject(folder: FolderContents): boolean {
  const ownFiles = folder.files.filter((path) => !path.includes('/') && !path.startsWith('.'))
  return ownFiles.length > 0 && folder.repositories.length === 0
}

export const notARepositoryTip: TipRule = ({ outputs, folder }) => {
  if (!failed(outputs) || !printed(outputs, NOT_A_REPOSITORY)) return null
  if (holdsUntrackedProject(folder)) {
    return "This folder isn't a Git repository yet. If it's your project, run `git init` here to start one."
  }
  return "This folder isn't a Git repository. Run `ls`: if your project is a folder here, `cd` into it first. Run `git init` only to start a brand-new repository."
}
