import type { FolderContents } from '@/lib/git-sim/fs/folderContents'
import type { CommandWord } from '@/lib/git-sim/input/tokenize'

export type Output = {
  stream: 'stdout' | 'stderr'
  text: string
}

export type TipContext = {
  branch?: string | null
  folder?: FolderContents
  newOnGitHubMain?: boolean
}

export type TipInput = {
  line: string
  tokens: readonly CommandWord[]
  outputs: readonly Output[]
  branch: string | null
  folder: FolderContents
  newOnGitHubMain: boolean
}

export type TipRule = (input: TipInput) => string | null

export function failed(outputs: readonly Output[]): boolean {
  return outputs.some((output) => output.stream === 'stderr')
}

export function printed(outputs: readonly Output[], pattern: RegExp): boolean {
  return outputs.some((output) => pattern.test(output.text))
}

export function firstCapture(outputs: readonly Output[], pattern: RegExp): string | null {
  return outputs.map((output) => pattern.exec(output.text)?.[1]).find(Boolean) ?? null
}
