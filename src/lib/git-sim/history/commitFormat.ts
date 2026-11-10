import type { ReadCommitResult } from 'isomorphic-git'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { CourseExplanationError, SandboxError } from '@/lib/git-sim/errors'
import { commitSubject } from './commitSubject'
import { decorationLabel, type RefDecorations } from './decorations'
import { formatGitDate, formatIsoDate, formatRfc2822Date, formatShortDate, formatStrictIsoDate, timeWithOffset } from './formatDate'
import { fullCommitLines } from './fullCommitLines'
import { formatRelativeDate } from './relativeDate'
import { shortOid } from './repository'

type NamedFormat = 'oneline' | 'short' | 'medium' | 'full' | 'fuller' | 'email' | 'mboxrd' | 'raw' | 'reference'

export type CommitFormat =
  | { kind: 'named'; name: NamedFormat; abbreviate: boolean }
  | { kind: 'template'; template: string; terminated: boolean }

type Person = ReadCommitResult['commit']['author']

const NAMED_FORMATS: readonly string[] = ['oneline', 'short', 'medium', 'full', 'fuller', 'email', 'mboxrd', 'raw', 'reference']
const SINGLE_LINE_FORMATS: readonly string[] = ['oneline', 'reference']

const PLACEHOLDER = /%(?:x[0-9a-fA-F]{2}|C\([^)]*\)|C(?:red|green|blue|reset)|[ac][nNeElLdDrtisIh]|[%nHhTtPpsbBdDeNfm]|[GS].?|g[dDnNeEs]?|[<>]{1,2}\(|w\(|\()/g

const UNSIMULATED_PLACEHOLDER = /^%(?:[ac]h|m|[GS]|g[dDnNeEs]|[<>]{1,2}\(|w\(|\()/

function isNamedFormat(value: string): value is NamedFormat {
  return NAMED_FORMATS.includes(value)
}

function parseFormatValue(value: string): CommitFormat {
  if (value.startsWith('format:')) return { kind: 'template', template: value.slice('format:'.length), terminated: false }
  if (value.startsWith('tformat:')) return { kind: 'template', template: value.slice('tformat:'.length), terminated: true }
  if (isNamedFormat(value)) return { kind: 'named', name: value, abbreviate: false }
  if (value === '' || value.includes('%')) return { kind: 'template', template: value, terminated: true }
  throw new SandboxError(`fatal: invalid --pretty format: ${value}`)
}

export function commitFormatOf(line: CommandLine): CommitFormat {
  const chosen = line.lastOf('--oneline', '--format', '--pretty')
  if (chosen === '--oneline') return { kind: 'named', name: 'oneline', abbreviate: true }
  if (!chosen) return { kind: 'named', name: 'medium', abbreviate: false }

  const value = line.value(chosen)
  if (value !== undefined) return parseFormatValue(value)
  if (chosen === '--format') throw new SandboxError('fatal: unrecognized argument: --format')
  return { kind: 'named', name: 'medium', abbreviate: false }
}

function decorationsAt(decorations: RefDecorations, oid: string): string {
  return decorations.get(oid)?.join(', ') ?? ''
}

function bodyOf(message: string): string {
  const lines = message.split('\n')
  return lines.length > 2 ? lines.slice(2).join('\n') : ''
}

function isTitleCharacter(character: string): boolean {
  return /[A-Za-z0-9._]/.test(character)
}

function sanitizedSubject(message: string): string {
  let result = ''
  let gap = false
  for (const character of commitSubject(message)) {
    if (!isTitleCharacter(character)) {
      gap = result !== ''
      continue
    }
    if (gap) result += '-'
    gap = false
    if (character !== '.' || !result.endsWith('.')) result += character
  }
  return result.replace(/[.-]+$/, '')
}

function localPart(email: string): string {
  return email.split('@')[0] ?? ''
}

function expandPerson(field: string, person: Person): string | undefined {
  switch (field) {
    case 'n':
    case 'N':
      return person.name
    case 'e':
    case 'E':
      return person.email
    case 'l':
    case 'L':
      return localPart(person.email)
    case 'd':
      return formatGitDate(person.timestamp, person.timezoneOffset)
    case 'D':
      return formatRfc2822Date(person.timestamp, person.timezoneOffset)
    case 'r':
      return formatRelativeDate(person.timestamp)
    case 't':
      return String(person.timestamp)
    case 'i':
      return formatIsoDate(person.timestamp, person.timezoneOffset)
    case 'I':
      return formatStrictIsoDate(person.timestamp, person.timezoneOffset)
    case 's':
      return formatShortDate(person.timestamp, person.timezoneOffset)
    default:
      return undefined
  }
}

function expandCommitField(token: string, entry: ReadCommitResult, decorations: RefDecorations): string {
  const { commit, oid } = entry
  const { message, parent, tree } = commit

  switch (token) {
    case '%%':
      return '%'
    case '%n':
      return '\n'
    case '%H':
      return oid
    case '%h':
      return shortOid(oid)
    case '%T':
      return tree
    case '%t':
      return shortOid(tree)
    case '%P':
      return parent.join(' ')
    case '%p':
      return parent.map(shortOid).join(' ')
    case '%s':
      return commitSubject(message)
    case '%f':
      return sanitizedSubject(message)
    case '%b':
      return bodyOf(message)
    case '%B':
      return message
    case '%d':
      return decorationLabel(decorations, oid)
    case '%D':
      return decorationsAt(decorations, oid)
    case '%e':
    case '%N':
      return ''
    default:
      return token
  }
}

function expandPlaceholder(token: string, entry: ReadCommitResult, decorations: RefDecorations): string {
  if (UNSIMULATED_PLACEHOLDER.test(token)) {
    throw new CourseExplanationError(`This practice terminal doesn't simulate ${token} in a log format. Try %h, %s or %an instead.`)
  }
  if (token.startsWith('%x')) return String.fromCharCode(Number.parseInt(token.slice(2), 16))
  if (token.startsWith('%C')) return ''

  const [, role, field] = /^%([ac])(.)$/.exec(token) ?? []
  if (role && field) {
    const expanded = expandPerson(field, role === 'a' ? entry.commit.author : entry.commit.committer)
    if (expanded !== undefined) return expanded
  }
  return expandCommitField(token, entry, decorations)
}

function expandTemplate(template: string, entry: ReadCommitResult, decorations: RefDecorations): string[] {
  return template.replace(PLACEHOLDER, (token) => expandPlaceholder(token, entry, decorations)).split('\n')
}

function messageBodyLines(message: string): string[] {
  const body = message.trimEnd().split('\n').slice(1).join('\n').replace(/^\n+/, '')
  return body === '' ? [] : body.split('\n')
}

function emailHeaderLines({ commit, oid }: ReadCommitResult): string[] {
  const { author, message } = commit
  return [
    `From ${oid} Mon Sep 17 00:00:00 2001`,
    `From: ${author.name} <${author.email}>`,
    `Date: ${formatRfc2822Date(author.timestamp, author.timezoneOffset)}`,
    `Subject: [PATCH] ${commitSubject(message)}`,
    '',
    ...messageBodyLines(message),
  ]
}

function rawHeaderLines({ commit, oid }: ReadCommitResult): string[] {
  const { author, committer, message, parent, tree } = commit
  return [
    `commit ${oid}`,
    `tree ${tree}`,
    ...parent.map((parentOid) => `parent ${parentOid}`),
    `author ${author.name} <${author.email}> ${timeWithOffset(author.timestamp, author.timezoneOffset)}`,
    `committer ${committer.name} <${committer.email}> ${timeWithOffset(committer.timestamp, committer.timezoneOffset)}`,
    '',
    ...message.trimEnd().split('\n').map((line) => `    ${line}`),
  ]
}

function namedHeaderLines(entry: ReadCommitResult, name: NamedFormat, decorations: RefDecorations, abbreviate: boolean): string[] {
  const { commit, oid } = entry
  if (name === 'oneline') {
    return [`${abbreviate ? shortOid(oid) : oid}${decorationLabel(decorations, oid)} ${commitSubject(commit.message)}`]
  }
  if (name === 'email' || name === 'mboxrd') return emailHeaderLines(entry)
  if (name === 'raw') return rawHeaderLines(entry)
  if (name === 'reference') {
    return [`${shortOid(oid)} (${commitSubject(commit.message)}, ${formatShortDate(commit.committer.timestamp, commit.committer.timezoneOffset)})`]
  }

  const medium = fullCommitLines(entry, decorations).slice(0, -1)
  if (name === 'medium') return medium

  const indented = medium.slice(medium.indexOf('') + 1)
  const headers = medium.slice(0, medium.indexOf('')).filter((header) => !header.startsWith('Date:'))
  if (name === 'short') return [...headers, '', `    ${commitSubject(commit.message)}`]

  const committerLine = `Commit: ${commit.committer.name} <${commit.committer.email}>`
  if (name === 'full') return [...headers, committerLine, '', ...indented]

  const { author, committer } = commit
  return [
    ...headers.map((header) => (header.startsWith('Author:') ? header.replace('Author: ', 'Author:     ') : header)),
    `AuthorDate: ${formatGitDate(author.timestamp, author.timezoneOffset)}`,
    `Commit:     ${committer.name} <${committer.email}>`,
    `CommitDate: ${formatGitDate(committer.timestamp, committer.timezoneOffset)}`,
    '',
    ...indented,
  ]
}

export function commitHeaderLines(entry: ReadCommitResult, format: CommitFormat, decorations: RefDecorations): string[] {
  if (format.kind === 'named') return namedHeaderLines(entry, format.name, decorations, format.abbreviate)
  return format.template === '' ? [] : expandTemplate(format.template, entry, decorations)
}

function isSingleLine(format: CommitFormat): boolean {
  return format.kind === 'named' && SINGLE_LINE_FORMATS.includes(format.name)
}

export function separatedByBlank(format: CommitFormat): boolean {
  return format.kind === 'named' && !isSingleLine(format)
}

function dividerBeforeChanges(sections: readonly (readonly string[])[], format: CommitFormat, isMerge: boolean): string[] {
  if (isMerge) return ['']
  if (isSingleLine(format)) return []
  return [sections.length > 1 ? '---' : '']
}

export function commitBlock(
  header: readonly string[],
  changeSections: readonly (readonly string[])[],
  format: CommitFormat,
  isMerge: boolean,
): string[] {
  const sections = changeSections.filter((section) => section.length > 0)
  const body = sections.flatMap((section, index) => (index === 0 ? section : ['', ...section]))
  if (sections.length === 0 || header.length === 0) return [...header, ...body]
  return [...header, ...dividerBeforeChanges(sections, format, isMerge), ...body]
}
