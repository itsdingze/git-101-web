import { describe, expect, it } from 'vitest'
import type { ContentBlock, DiffBlock } from '@/types'
import { editorGroups } from './editorGroups'

function diff(fileName: string): DiffBlock {
  return { type: 'diff', path: `~/todo-app/${fileName}`, fileName, folder: 'todo-app', lines: [{ change: 'added', text: fileName }] }
}

const intro: ContentBlock = { type: 'text', value: 'Intro' }
const outro: ContentBlock = { type: 'text', value: 'Outro' }

describe('editorGroups', () => {
  it('opens diff blocks that follow each other as tabs of one editor', () => {
    expect(editorGroups([intro, diff('app.txt'), diff('tasks.txt'), outro])).toEqual([
      intro,
      { type: 'editor', files: [diff('app.txt'), diff('tasks.txt')] },
      outro,
    ])
  })

  it('keeps diff blocks with other content between them in separate editors', () => {
    expect(editorGroups([diff('app.txt'), intro, diff('tasks.txt')])).toEqual([
      { type: 'editor', files: [diff('app.txt')] },
      intro,
      { type: 'editor', files: [diff('tasks.txt')] },
    ])
  })

  it('leaves content without diff blocks as it is', () => {
    expect(editorGroups([intro, outro])).toEqual([intro, outro])
  })
})
