import { describe, expect, it } from 'vitest'
import type { ContentBlock } from '@/types'
import { blockKey } from './blockKey'

const text = (value: string): ContentBlock => ({ type: 'text', value })

describe('blockKey', () => {
  it('gives the same block at the same position the same key', () => {
    expect(blockKey(text('Hello'), 0)).toBe(blockKey(text('Hello'), 0))
  })

  it('tells identical blocks apart by position', () => {
    expect(blockKey(text('Hello'), 0)).not.toBe(blockKey(text('Hello'), 1))
  })

  it('tells blocks apart by content', () => {
    expect(blockKey(text('Hello'), 0)).not.toBe(blockKey(text('Goodbye'), 0))
  })

  it('tells blocks apart by type, even with matching text', () => {
    const code: ContentBlock = { type: 'code', language: 'bash', value: 'Hello' }

    expect(blockKey(code, 0)).not.toBe(blockKey(text('Hello'), 0))
  })

  it('keys every kind of block by what it shows', () => {
    const blocks: ContentBlock[] = [
      { type: 'list', items: ['one', 'two'] } as ContentBlock,
      { type: 'tabs', group: 'computer', label: 'Choose your computer', tabs: [{ label: 'Mac', content: [] }] },
      { type: 'files', path: '~/todo-app', home: [] },
      { type: 'terminal', lines: [{ kind: 'output', text: 'On branch main', note: '' }] },
    ]
    const changed: ContentBlock[] = [
      { type: 'list', items: ['three'] } as ContentBlock,
      { type: 'tabs', group: 'computer', label: 'Choose your computer', tabs: [{ label: 'Windows', content: [] }] },
      { type: 'files', path: '~/notes', home: [] },
      { type: 'terminal', lines: [{ kind: 'output', text: 'On branch feature', note: '' }] },
    ]

    blocks.forEach((block, index) => {
      expect(blockKey(block, 0)).not.toBe(blockKey(changed[index]!, 0))
    })
  })

  it('keys an editor group by its file names', () => {
    const editor = (fileName: string) => ({ type: 'editor' as const, files: [{ type: 'diff' as const, path: `~/todo-app/${fileName}`, fileName, folder: 'todo-app', lines: [] }] })

    expect(blockKey(editor('a.txt'), 0)).not.toBe(blockKey(editor('b.txt'), 0))
  })
})
