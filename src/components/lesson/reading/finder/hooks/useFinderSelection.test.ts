// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { FileEntry } from '@/types'
import { useFinderSelection } from './useFinderSelection'

const NOTES: FileEntry = { name: 'notes', kind: 'folder', hidden: false, entries: [] }
const APP: FileEntry = { name: 'app.txt', kind: 'file', hidden: false }

const HOME = ['Users', 'sam']

function renderSelection(entries: readonly FileEntry[] = [NOTES, APP]) {
  const enter = vi.fn<(folder: string) => void>()
  const hook = renderHook(() => useFinderSelection(HOME, entries, enter))
  return { ...hook, enter }
}

afterEach(cleanup)

describe('useFinderSelection', () => {
  it('selects an entry on a click and opens a folder on a double-click', () => {
    const { result, enter } = renderSelection()

    act(() => result.current.press(NOTES))
    expect(result.current.selected).toBe('notes')

    act(() => result.current.doublePress(NOTES))
    expect(enter).toHaveBeenCalledWith('notes')
  })

  it('leaves a file selected and unopened on a double-click', () => {
    const { result, enter } = renderSelection()

    act(() => result.current.press(APP))
    act(() => result.current.doublePress(APP))

    expect(result.current.selected).toBe('app.txt')
    expect(enter).not.toHaveBeenCalled()
  })

  it('opens a folder on a single tap with a finger, where double-tapping is unreliable', () => {
    const { result, enter } = renderSelection()

    act(() => result.current.notePointer('touch'))
    act(() => result.current.press(NOTES))

    expect(enter).toHaveBeenCalledWith('notes')
  })

  it('selects a file on a tap with a finger', () => {
    const { result, enter } = renderSelection()

    act(() => result.current.notePointer('touch'))
    act(() => result.current.press(APP))

    expect(result.current.selected).toBe('app.txt')
    expect(enter).not.toHaveBeenCalled()
  })

  it('clears the selection', () => {
    const { result } = renderSelection()
    act(() => result.current.press(APP))

    act(() => result.current.clear())

    expect(result.current.selected).toBeNull()
  })

  it('forgets the selection when another folder is shown', () => {
    const enter = vi.fn<(folder: string) => void>()
    const { result, rerender } = renderHook(({ location }) => useFinderSelection(location, [NOTES, APP], enter), {
      initialProps: { location: HOME },
    })
    act(() => result.current.press(APP))

    rerender({ location: [...HOME, 'notes'] })

    expect(result.current.selected).toBeNull()
  })

  it('keeps the selection when the same folder is shown again with a fresh list', () => {
    const enter = vi.fn<(folder: string) => void>()
    const { result, rerender } = renderHook(({ location, entries }) => useFinderSelection(location, entries, enter), {
      initialProps: { location: HOME, entries: [NOTES, APP] as readonly FileEntry[] },
    })
    act(() => result.current.press(APP))

    rerender({ location: [...HOME], entries: [NOTES, APP] })

    expect(result.current.selected).toBe('app.txt')
  })

  it.each([
    ['ArrowRight', null, 'a'],
    ['ArrowRight', 'a', 'b'],
    ['ArrowRight', 'e', 'e'],
    ['ArrowLeft', 'b', 'a'],
    ['ArrowLeft', 'a', 'a'],
    ['ArrowDown', 'b', 'e'],
    ['ArrowDown', 'c', 'c'],
    ['ArrowUp', 'e', 'b'],
    ['ArrowUp', 'b', 'b'],
  ])('moves the selection with %s from %s to %s in a grid three entries wide', (key, from, to) => {
    const entries = ['a', 'b', 'c', 'd', 'e'].map((name): FileEntry => ({ name, kind: 'file', hidden: false }))
    const { result } = renderSelection(entries)
    const start = entries.find((entry) => entry.name === from)
    if (start) act(() => result.current.press(start))

    let handled = false
    act(() => {
      handled = result.current.pressKey({ key, command: false, columns: 3 })
    })

    expect(handled).toBe(true)
    expect(result.current.selected).toBe(to)
  })

  it.each([
    ['Enter', false],
    ['ArrowDown', true],
  ])('opens the selected folder with %s, command held: %s', (key, command) => {
    const { result, enter } = renderSelection()
    act(() => result.current.press(NOTES))

    let handled = false
    act(() => {
      handled = result.current.pressKey({ key, command, columns: 3 })
    })

    expect(handled).toBe(true)
    expect(enter).toHaveBeenCalledWith('notes')
  })

  it('leaves Enter to the page when a file or nothing is selected', () => {
    const { result, enter } = renderSelection()
    expect(result.current.pressKey({ key: 'Enter', command: false, columns: 3 })).toBe(false)

    act(() => result.current.press(APP))

    expect(result.current.pressKey({ key: 'Enter', command: false, columns: 3 })).toBe(false)
    expect(enter).not.toHaveBeenCalled()
  })
})
