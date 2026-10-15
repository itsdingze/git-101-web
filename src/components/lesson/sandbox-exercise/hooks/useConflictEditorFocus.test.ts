// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useConflictEditorFocus } from './useConflictEditorFocus'

let editor: HTMLTextAreaElement
let openButton: HTMLButtonElement

type Props = { openPath: string | undefined }

function renderEditorFocus() {
  const closed: Props = { openPath: undefined }
  const hook = renderHook(({ openPath }: Props) => useConflictEditorFocus(openPath), { initialProps: closed })
  hook.result.current.editorRef.current = editor
  hook.result.current.openButtonRef('recipe.txt')(openButton)
  return hook
}

beforeEach(() => {
  editor = document.createElement('textarea')
  openButton = document.createElement('button')
  document.body.append(editor, openButton)
})

afterEach(() => {
  cleanup()
  editor.remove()
  openButton.remove()
})

describe('useConflictEditorFocus', () => {
  it('moves focus into the editor when a file opens', () => {
    const { rerender } = renderEditorFocus()

    rerender({ openPath: 'recipe.txt' })

    expect(document.activeElement).toBe(editor)
  })

  it('returns focus to the button that opened the file when it closes', () => {
    const { result, rerender } = renderEditorFocus()
    rerender({ openPath: 'recipe.txt' })

    result.current.returnFocusOnClose('recipe.txt')
    rerender({ openPath: undefined })

    expect(document.activeElement).toBe(openButton)
  })

  it('leaves focus alone when the file closed without asking for it back', () => {
    const { rerender } = renderEditorFocus()
    rerender({ openPath: 'recipe.txt' })

    rerender({ openPath: undefined })

    expect(document.activeElement).toBe(editor)
  })
})
