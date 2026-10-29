import { completionCandidates, type Candidate } from './completionCandidates'
import type { CommandLocks } from './commandLocks'
import { lastCommandWords } from './tokenize'
import type { CommandContext } from '@/lib/git-sim/types'

export type Completion = {
  line: string
  cursor: number
  matches: readonly string[]
}

function commonPrefix(words: readonly string[]): string {
  return words.reduce((prefix, word) => {
    let length = 0
    while (length < prefix.length && prefix[length] === word[length]) length += 1
    return prefix.slice(0, length)
  })
}

function replacementFor(candidates: readonly Candidate[], word: string): string {
  const [only] = candidates
  if (candidates.length === 1 && only) return only.folder ? only.word : `${only.word} `
  const prefix = commonPrefix(candidates.map((candidate) => candidate.word))
  return prefix.length > word.length ? prefix : word
}

export async function completeLine(
  ctx: CommandContext,
  locks: CommandLocks,
  line: string,
  cursor: number,
): Promise<Completion> {
  const head = line.slice(0, cursor)
  const wordStart = head.search(/\S*$/)
  const word = head.slice(wordStart)
  const before = lastCommandWords(head.slice(0, wordStart))

  const candidates = await completionCandidates(ctx, locks, before, word)
  if (candidates.length === 0) return { line, cursor, matches: [] }

  const replacement = replacementFor(candidates, word)
  return {
    line: `${line.slice(0, wordStart)}${replacement}${line.slice(cursor)}`,
    cursor: wordStart + replacement.length,
    matches: candidates.map((candidate) => candidate.label),
  }
}
