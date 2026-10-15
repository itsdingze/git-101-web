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
import { parseTerminalBlock } from './terminalBlock'

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
const CALLOUT = /^> \[!(\w+)\](?: (.+))?$/
const CALLOUT_VARIANTS = ['info', 'tip', 'warning', 'danger'] as const satisfies readonly CalloutVariant[]

function isStructuralLine(line: string): boolean {
  return line.startsWith('## ') || line.startsWith(TAB) || line === TABS_END
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

    const tabLabel = reader.next().slice(TAB.length).trim()
    const content: TabContent[] = []
    for (reader.skipBlankLines(); !reader.done && !isStructuralLine(reader.peek()); reader.skipBlankLines()) {
      content.push(parseTabContentBlock(reader))
    }
    tabs.push({ label: tabLabel, content })
  }
  reader.next()
  return { type: 'tabs', group, label, tabs }
}

function parseTabContentBlock(reader: LineReader): TabContent {
  const line = reader.peek()
  if (line.startsWith(TABS)) throw reader.error('tabs cannot sit inside other tabs')
  if (line.startsWith(FENCE)) return readCode(reader)
  if (BULLET.test(line)) return { type: 'list', items: readList(reader, BULLET) }
  if (NUMBER.test(line)) return { type: 'list', ordered: true, items: readList(reader, NUMBER) }
  if (CALLOUT.test(line)) return readCallout(reader)
  return { type: 'text', value: readParagraph(reader) }
}

function readCallout(reader: LineReader): CalloutBlock {
  const [, kind = '', title] = CALLOUT.exec(reader.peek()) ?? []
  const variant = kind.toLowerCase()
  if (!isCalloutVariant(variant)) throw reader.error(`unknown callout [!${kind}], use one of ${CALLOUT_VARIANTS.join(', ')}`)
  reader.next()

  const lines: string[] = []
  while (reader.peek().startsWith(QUOTE)) lines.push(reader.next().slice(QUOTE.length))
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
  const body = readFenceLines(reader)
  if (language === DIFF) return parseDiffBlock(reader, rest.join(' '), body, start)
  if (language === FILES) return parseFilesBlock(reader, rest.join(' '), body, start)
  if (language === TERMINAL) return parseTerminalBlock(body)
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
    body.push(reader.next())
  }
  reader.next()
  return body
}

function readParagraph(reader: LineReader): string {
  const lines: string[] = []
  while (!reader.done && reader.peek().trim() !== '' && !isStructuralLine(reader.peek())) lines.push(reader.next())
  return lines.join('\n')
}
