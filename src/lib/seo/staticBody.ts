import type { ContentBlock, FileEntry, ReadingStep, Step, TerminalTranscriptLine } from '../../types'
import { messages } from '../../messages/en'
import type { LessonSummary } from './pageMeta'
import { escapeHtml } from './renderHead'
import { SITE_URL, lessonPath } from './site'

export interface LessonArticle extends LessonSummary {
  steps: readonly Step[]
}

const SITE_PATH = new URL(SITE_URL).pathname

const ARTICLE = 'js:hidden mx-auto flex w-full max-w-content flex-col gap-6 px-6 py-12 text-sm leading-relaxed text-text-secondary sm:px-8 sm:py-16'
const TITLE = 'text-3xl sm:text-4xl font-semibold text-text-primary tracking-tight leading-tight'
const HEADING = 'text-xl font-semibold text-text-primary tracking-tight'
const SECTION = 'flex flex-col gap-3'
const PRE = 'overflow-x-auto rounded-lg bg-bg-card p-3 font-mono text-xs whitespace-pre'
const LINK = 'text-accent-blue-strong underline'
const BAR = 'block max-w-full rounded bg-bg-card motion-safe:animate-pulse'
const PLACEHOLDER = 'hidden js:flex flex-1 flex-col'
const PLACEHOLDER_COLUMN = 'mx-auto flex w-full max-w-content flex-col gap-6 px-6 py-12 sm:px-8 sm:py-16'

const INLINE_CODE = /`([^`\n]+)`/g
const INLINE_BOLD = /\*\*([^*\n]+)\*\*/g
const INLINE_LINK = /\[([^\]]+)\]\((https?:\/\/[^)`<]+)\)/g
const INLINE_DOWNLOAD = /\[([^\]]+)\]\(\/(downloads\/[a-zA-Z0-9_-]+\.zip)\)/g

function inlineHtml(value: string): string {
  return escapeHtml(value)
    .replace(INLINE_CODE, '<code>$1</code>')
    .replace(INLINE_BOLD, '<strong>$1</strong>')
    .replace(INLINE_LINK, `<a class="${LINK}" href="$2">$1</a>`)
    .replace(INLINE_DOWNLOAD, `<a class="${LINK}" href="${SITE_PATH}$2" download>$1</a>`)
}

function preformatted(lines: readonly string[]): string {
  return `<pre class="${PRE}">${escapeHtml(lines.join('\n'))}</pre>`
}

function transcriptLine(line: TerminalTranscriptLine): string {
  return line.kind === 'command' ? `$ ${line.text}` : line.text
}

function treeLines(entries: readonly FileEntry[], depth: number): string[] {
  const indent = '  '.repeat(depth)
  return entries.flatMap((entry) =>
    entry.kind === 'folder' ? [`${indent}${entry.name}/`, ...treeLines(entry.entries, depth + 1)] : [`${indent}${entry.name}`],
  )
}

function blockHtml(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return `<p>${inlineHtml(block.value)}</p>`
    case 'list': {
      const items = block.items.map((item) => `<li>${inlineHtml(item)}</li>`).join('')
      return block.ordered ? `<ol class="list-decimal pl-5">${items}</ol>` : `<ul class="list-disc pl-5">${items}</ul>`
    }
    case 'code':
      return preformatted([block.value])
    case 'terminal':
      return preformatted(block.lines.map(transcriptLine))
    case 'diff':
      return preformatted(block.lines.map((line) => `${{ added: '+', removed: '-', unchanged: ' ' }[line.change]}${line.text}`))
    case 'files':
      return `<p><code>${escapeHtml(block.path)}</code></p>${preformatted(treeLines(block.home, 0))}`
    case 'callout':
      return `<aside class="${SECTION}">${block.title ? `<strong>${inlineHtml(block.title)}</strong>` : ''}<p>${inlineHtml(block.value)}</p></aside>`
    case 'tabs':
      return block.tabs
        .map((tab) => `<section class="${SECTION}"><h3 class="font-semibold">${inlineHtml(tab.label)}</h3>${tab.content.map(blockHtml).join('')}</section>`)
        .join('')
  }
}

function readingHtml(step: ReadingStep): string {
  const heading = step.title ? `<h2 class="${HEADING}">${inlineHtml(step.title)}</h2>` : ''
  return `<section class="${SECTION}">${heading}${step.content.map(blockHtml).join('')}</section>`
}

function isReading(step: Step): step is ReadingStep {
  return step.type === 'reading'
}

function article(content: string): string {
  return `<article class="${ARTICLE}">${content}</article>`
}

function title(text: string): string {
  return `<h1 class="${TITLE}">${inlineHtml(text)}</h1>`
}

function bar(size: string): string {
  return `<span class="${BAR} ${size}"></span>`
}

function placeholder(bars: readonly string[]): string {
  return `<div aria-hidden="true" class="${PLACEHOLDER}"><div class="h-14 shrink-0 border-b border-border"></div><div class="${PLACEHOLDER_COLUMN}">${bars.map(bar).join('')}</div></div>`
}

const TEXT_PLACEHOLDER = placeholder(['h-7 w-56', 'h-4 w-full', 'h-4 w-full', 'h-4 w-2/3'])
const LIST_PLACEHOLDER = placeholder(['h-10 w-64', 'h-11 w-38', 'h-14 w-full', 'h-14 w-full', 'h-14 w-full', 'h-14 w-full'])

function link(href: string, text: string): string {
  return `<a class="${LINK}" href="${href}">${escapeHtml(text)}</a>`
}

export function lessonBody(lesson: LessonArticle): string {
  const sections = lesson.steps.filter(isReading).map(readingHtml).join('')
  const notice = `<noscript><p>${escapeHtml(messages.noScript.practice)}</p></noscript>`
  return article(`${title(lesson.title)}<p>${inlineHtml(lesson.description)}</p>${notice}${sections}`) + TEXT_PLACEHOLDER
}

export function homeBody(lessons: readonly LessonSummary[]): string {
  const items = lessons
    .map((lesson) => `<li class="${SECTION}">${link(SITE_PATH + lessonPath(lesson.id), lesson.title)}<p>${inlineHtml(lesson.description)}</p></li>`)
    .join('')
  return article(`${title(messages.home.hero.title)}<p>${escapeHtml(messages.home.description)}</p><ol class="flex flex-col gap-6">${items}</ol>`) + LIST_PLACEHOLDER
}

export function summaryBody(lesson: LessonSummary): string {
  return article(`${title(lesson.title)}<p>${link(SITE_PATH + lessonPath(lesson.id), messages.noScript.openLesson)}</p>`) + TEXT_PLACEHOLDER
}

export function notFoundBody(): string {
  const copy = messages.notFound.page
  return article(`${title(copy.title)}<p>${escapeHtml(copy.body)}</p><p>${link(SITE_PATH, messages.notFound.back)}</p>`) + TEXT_PLACEHOLDER
}
