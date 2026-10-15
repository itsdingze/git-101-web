import { describe, expect, it } from 'vitest'
import type { CodeBlock, ContentBlock, ReadingStep, TerminalBlock, TerminalTranscriptLine } from '@/types'
import { lessons } from '@/data/lessons'
import { alignShellComments, renderedWidth } from '@/lib/text/shellComment'

const CODE_BLOCK_COLUMNS = 78
const TERMINAL_COLUMNS = 68
const TERMINAL_COLUMNS_IN_TAB = 64

type NotableBlock = { block: CodeBlock | TerminalBlock; columns: number }

function notableBlocksIn(content: readonly ContentBlock[], columns = TERMINAL_COLUMNS): NotableBlock[] {
  return content.flatMap((block) => {
    if (block.type === 'code' || block.type === 'terminal') return [{ block, columns }]
    if (block.type === 'tabs') return notableBlocksIn(block.tabs.flatMap((tab) => tab.content), TERMINAL_COLUMNS_IN_TAB)
    return []
  })
}

const readingBlocks = lessons.flatMap((lesson) =>
  lesson.steps
    .filter((step): step is ReadingStep => step.type === 'reading')
    .flatMap((step) => notableBlocksIn(step.content).map((found) => ({ lessonId: lesson.id, stepId: step.id, ...found }))),
)

const shellBlocks = readingBlocks.flatMap(({ block, lessonId, stepId }) =>
  block.type === 'code' && block.language === 'bash' ? [{ lessonId, stepId, value: block.value }] : [],
)

const terminalBlocks = readingBlocks.flatMap(({ block, ...where }) =>
  block.type === 'terminal' ? [{ ...where, lines: block.lines }] : [],
)

function widestNotedLine(value: string): number {
  const noted = alignShellComments(value.split('\n')).filter((line) => line.code.trim() !== '' && line.comment !== '')
  return Math.max(0, ...noted.map((line) => renderedWidth(line.code + line.comment)))
}

function shownText(line: TerminalTranscriptLine): string {
  if (line.kind === 'note') return line.text
  if (line.kind === 'output') return line.text + line.note
  const { directory, branch } = line.prompt
  const prompt = `${directory}${branch ? ` (${branch})` : ''} $`
  return `${prompt}${line.text ? ` ${line.text}` : ''}${line.note}`
}

function widestTerminalNote(lines: readonly TerminalTranscriptLine[]): number {
  const noted = lines.filter((line) => line.kind === 'note' || line.note !== '')
  return Math.max(0, ...noted.map((line) => renderedWidth(shownText(line))))
}

describe('every shell code block', () => {
  it.each(shellBlocks)(
    'fits its aligned notes in the code block, lesson $lessonId ($stepId)',
    ({ value }) => {
      expect(widestNotedLine(value)).toBeLessThanOrEqual(CODE_BLOCK_COLUMNS)
    },
  )
})

describe('every terminal example', () => {
  it.each(terminalBlocks)(
    'fits its notes in the $columns-column terminal, lesson $lessonId ($stepId)',
    ({ lines, columns }) => {
      expect(widestTerminalNote(lines)).toBeLessThanOrEqual(columns)
    },
  )
})
