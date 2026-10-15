import type { ReadCommitResult } from 'isomorphic-git'
import { shortOid } from './repository'
import { formatGitDate } from './formatDate'
import { decorationLabel, type RefDecorations } from './decorations'

export function fullCommitLines(entry: ReadCommitResult, decorations: RefDecorations): string[] {
  const { author, message } = entry.commit
  return [
    `commit ${entry.oid}${decorationLabel(decorations, entry.oid)}`,
    ...(entry.commit.parent.length > 1
      ? [`Merge: ${entry.commit.parent.map(shortOid).join(' ')}`]
      : []),
    `Author: ${author.name} <${author.email}>`,
    `Date:   ${formatGitDate(author.timestamp, author.timezoneOffset)}`,
    '',
    ...message.trimEnd().split('\n').map((line) => `    ${line}`),
    '',
  ]
}
