// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useFileEditor } from './useFileEditor'

const FILES: Record<string, string> = { 'recipe.txt': 'Flour\n' }

function renderFileEditor() {
  const readFile = (path: string) => Promise.resolve(FILES[path] ?? '')
  const saveFile = vi.fn<(path: string, contents: string) => void>()
  const hook = renderHook(() => useFileEditor(readFile, saveFile))
  return { ...hook, saveFile }
}

afterEach(cleanup)

describe('useFileEditor', () => {
  it('opens a file with its current contents', async () => {
    const { result } = renderFileEditor()

    act(() => result.current.open('recipe.txt'))

    await waitFor(() => expect(result.current.openFile).toEqual({ path: 'recipe.txt', text: 'Flour\n' }))
  })

  it('saves the edited text to the same file and closes the editor', async () => {
    const { result, saveFile } = renderFileEditor()
    act(() => result.current.open('recipe.txt'))
    await waitFor(() => expect(result.current.openFile).not.toBeNull())

    act(() => result.current.edit('Flour\nSugar\n'))
    act(() => result.current.save())

    expect(saveFile).toHaveBeenCalledWith('recipe.txt', 'Flour\nSugar\n')
    expect(result.current.openFile).toBeNull()
  })

  it('throws away edits when closed without saving', async () => {
    const { result, saveFile } = renderFileEditor()
    act(() => result.current.open('recipe.txt'))
    await waitFor(() => expect(result.current.openFile).not.toBeNull())

    act(() => result.current.edit('Salt\n'))
    act(() => result.current.close())

    expect(result.current.openFile).toBeNull()
    expect(saveFile).not.toHaveBeenCalled()
  })

  it('ignores edits and saves while no file is open', () => {
    const { result, saveFile } = renderFileEditor()

    act(() => result.current.edit('Salt\n'))
    act(() => result.current.save())

    expect(result.current.openFile).toBeNull()
    expect(saveFile).not.toHaveBeenCalled()
  })
})
