// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { FileEntry, FilesBlock } from '@/types'
import { useFinderNavigation } from './useFinderNavigation'

const SOUP: FileEntry = { name: 'soup.txt', kind: 'file', hidden: false }
const RECIPES: FileEntry = { name: 'recipes', kind: 'folder', hidden: false, entries: [SOUP] }
const PROJECTS: FileEntry = { name: 'projects', kind: 'folder', hidden: false, entries: [RECIPES] }
const BLOCK: FilesBlock = { type: 'files', path: '~/projects', home: [PROJECTS] }

afterEach(cleanup)

describe('useFinderNavigation', () => {
  it("opens at the block's folder with nothing to go back or forward to", () => {
    const { result } = renderHook(() => useFinderNavigation(BLOCK))

    expect(result.current).toMatchObject({
      location: ['home', 'user', 'projects'],
      entries: [RECIPES],
      canGoBack: false,
      canGoForward: false,
    })
  })

  it('enters a folder by name, then goes back and forward through the visit', () => {
    const { result } = renderHook(() => useFinderNavigation(BLOCK))

    act(() => result.current.enter('recipes'))
    expect(result.current).toMatchObject({ location: ['home', 'user', 'projects', 'recipes'], entries: [SOUP], canGoBack: true })

    act(() => result.current.goBack())
    expect(result.current).toMatchObject({ location: ['home', 'user', 'projects'], canGoBack: false, canGoForward: true })

    act(() => result.current.goForward())
    expect(result.current).toMatchObject({ location: ['home', 'user', 'projects', 'recipes'], canGoForward: false })
  })

  it('jumps to a folder further up, dropping the way forward', () => {
    const { result } = renderHook(() => useFinderNavigation(BLOCK))
    act(() => result.current.enter('recipes'))
    act(() => result.current.goBack())

    act(() => result.current.open([]))

    expect(result.current).toMatchObject({ location: [], canGoBack: true, canGoForward: false })
    expect(result.current.entries.map((entry) => entry.name)).toEqual(['home'])
  })

  it('stays put without a history entry when opening the folder already shown', () => {
    const { result } = renderHook(() => useFinderNavigation(BLOCK))

    act(() => result.current.open(['home', 'user', 'projects']))

    expect(result.current.canGoBack).toBe(false)
  })
})
