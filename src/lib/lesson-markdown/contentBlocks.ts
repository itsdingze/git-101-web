import type {
  CalloutBlock,
  CalloutVariant,
  CodeBlock,
  ContentBlock,
  DiffBlock,
  FilesBlock,
  TabsBlock,
  TerminalBlock,
} from '@/types'
import type { LineReader } from './LineReader'
import { parseDiffBlock } from './diffBlock'
import { parseFilesBlock } from './filesBlock'
import { parseTerminalBlock, requirePromptsFromHome } from './terminalBlock'

type TabContent = TabsBlock['tabs'][number]['content'][number]

export const FENCE = '```'

const TERMINAL = 'terminal'
const DIFF = 'diff'
const FILES = 'files'
const TABS = ':::tabs'
const TABS_END = ':::'
const TAB = '::tab '
const BULLET = /^- /
const NUMBER = /^\d+\. /
const CONTINUATION = '  '
const QUOTE = '> '
const QUOTE_MARK = '>'
const UNSUPPORTED_HEADING = /^(?:#|#{3,6}) /
const CALLOUT =/^> \[!(\w+)\](?: (.+))?$/
const CALLOUT_VARIANTS = ['info', 'tip', 'warning', 'danger'] as const satisfies readonly CalloutVariant[]

const CODE_LANGUAGES = ['bash', 'text', 'markdown', TERMINAL, DIFF, FILES]
const EXERCISE_AND_DIAGRAM_LANGUAGES = ['quiz', 'block-exercise', 'sandbox-exercise', 'visualization']

function isStructuralLine(line: string): boolean {
  return line.startsWith('## ') || line.startsWith(TAB) || line === TABS_END
}

function startsBlock(line: string): boolean {
  return line.startsWith(FENCE) || BULLET.test(line) || NUMBER.test(line) || line.startsWith(QUOTE_MARK) || UNSUPPORTED_HEADING.test(line)
}

export function parseContentBlock(reader: LineReader): ContentBlock {
  const line = reader.peek()
  if (line.startsWith(TABS)) return readTabs(reader)
  return parseTabContentBlock(reader)
}

function readTabs(reader: LineReader): TabsBlock {
  const start = reader.lineNumber
  const [group = '', ...labelWords] = reader.next().slice(TABS.length).trim().split(/\s+/)
  const label = labelWords.join(' ')
  if (!group || !label) {
    throw reader.error('name the tab group, then label the tabs, like ":::tabs os Choose your computer"', start)
  }

  const tabs: TabsBlock['tabs'][number][] = []
  for (reader.skipBlankLines(); reader.peek() !== TABS_END; reader.skipBlankLines()) {
    if (reader.done) throw reader.error('these tabs are never closed with :::', start)
    if (!reader.peek().startsWith(TAB)) throw reader.error('start each tab with "::tab Label"')

    const tabLine = reader.lineNumber
    const tabLabel = reader.next().slice(TAB.length).trim()
    if (!tabLabel) throw reader.error('give this tab a label, like "::tab Mac"', tabLine)

    const content: TabContent[] = []
    for (reader.skipBlankLines(); !reader.done && !isStructuralLine(reader.peek()); reader.skipBlankLines()) {
      content.push(parseTabContentBlock(reader))
    }
    if (content.length === 0) throw reader.error('this tab has nothing in it, so add text or remove the tab', tabLine)
    tabs.push({ label: tabLabel, content })
  }
  if (tabs.length === 0) throw reader.error('add at least one "::tab Label" to these tabs', start)
  reader.next()
  return { type: 'tabs', group, label, tabs }
}

function parseTabContentBlock(reader: LineReader): TabContent {
  const line = reader.peek()
  if (line.startsWith(TABS)) throw reader.error('tabs cannot sit inside other tabs')
  if (line === TABS_END) throw reader.error('this ::: closes a tab group, but no :::tabs block is open')
  if (line.startsWith(TAB)) throw reader.error('::tab only belongs inside a :::tabs block')
  if (UNSUPPORTED_HEADING.test(line)) throw reader.error('only "## Title {#id}" headings are supported, so start a new step or write a plain line')
  if (line.startsWith(QUOTE_MARK) && !CALLOUT.test(line)) throw reader.error('a quote is only supported as a callout, like "> [!TIP]" with each line after "> "')
  if (line.startsWith(FENCE)) return readCode(reader)
  if (BULLET.test(line)) return { type: 'list', items: readList(reader, BULLET) }
  if (NUMBER.test(line)) return { type: 'list', ordered: true, items: readList(reader, NUMBER) }
  if (CALLOUT.test(line)) return readCallout(reader)
  return { type: 'text', value: readParagraph(reader) }
}

function readCallout(reader: LineReader): CalloutBlock {
  const start = reader.lineNumber
  const [, kind = '', title] = CALLOUT.exec(reader.peek()) ?? []
  const variant = kind.toLowerCase()
  if (!isCalloutVariant(variant)) throw reader.error(`unknown callout [!${kind}], use one of ${CALLOUT_VARIANTS.join(', ')}`)
  reader.next()

  const lines: string[] = []
  while (reader.peek().startsWith(QUOTE)) lines.push(reader.next().slice(QUOTE.length))
  if (lines.length === 0) throw reader.error('add the callout text on the next line, after "> "', start)
  return title ? { type: 'callout', variant, title, value: lines.join('\n') } : { type: 'callout', variant, value: lines.join('\n') }
}

function isCalloutVariant(value: string): value is CalloutVariant {
  return (CALLOUT_VARIANTS as readonly string[]).includes(value)
}

function readList(reader: LineReader, marker: RegExp): string[] {
  const items: string[] = []
  while (marker.test(reader.peek())) {
    const lines = [reader.next().replace(marker, '')]
    while (reader.peek().startsWith(CONTINUATION)) lines.push(reader.next().slice(CONTINUATION.length))
    items.push(lines.join('\n'))
  }
  return items
}

function readCode(reader: LineReader): CodeBlock | DiffBlock | TerminalBlock | FilesBlock {
  const start = reader.lineNumber
  const [language = '', ...rest] = reader.peek().slice(FENCE.length).trim().split(/\s+/)
  if (EXERCISE_AND_DIAGRAM_LANGUAGES.includes(language)) throw reader.error(`a ${language} block can't sit inside a tab, so move it below the tabs`)
  if (!CODE_LANGUAGES.includes(language)) {
    throw reader.error(`unknown fence "${language}", use a code language (${CODE_LANGUAGES.join(', ')}) or an exercise (${EXERCISE_AND_DIAGRAM_LANGUAGES.join(', ')})`)
  }
  const body = readFenceLines(reader)
  if (language === DIFF) return parseDiffBlock(reader, rest.join(' '), body, start)
  if (language === FILES) return parseFilesBlock(reader, rest.join(' '), body, start)
  if (language === TERMINAL) {
    requirePromptsFromHome(reader, body, start)
    return parseTerminalBlock(body)
  }
  return { type: 'code', language, value: body.join('\n') }
}

export function readFence(reader: LineReader): string {
  return readFenceLines(reader).join('\n')
}

function readFenceLines(reader: LineReader): string[] {
  const start = reader.lineNumber
  reader.next()
  const body: string[] = []
  while (reader.peek() !== FENCE) {
    if (reader.done) throw reader.error('this code block is never closed with ```', start)
    if (reader.peek().trimEnd() === FENCE) throw reader.error('remove the spaces after this closing ```')
    body.push(reader.next())
  }
  reader.next()
  return body
}

function readParagraph(reader: LineReader): string {
  const lines: string[] = []
  while (!reader.done && reader.peek().trim() !== '' && !isStructuralLine(reader.peek()) && !startsBlock(reader.peek())) {
    lines.push(reader.next())
  }
  return lines.join('\n')
}
