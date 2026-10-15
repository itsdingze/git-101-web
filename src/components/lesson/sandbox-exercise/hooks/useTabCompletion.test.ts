// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { Completion } from '@/lib/git-sim/input/completion'
import { useTabCompletion } from './useTabCompletion'

let input: HTMLInputElement

function typeLine(line: string, caret = line.length) {
  input.value = line
  input.setSelectionRange(caret, caret)
}

function renderTabCompletion(complete: (line: string, cursor: number) => Promise<Completion | null>) {
  const listCompletions = vi.fn<(line: string, matches: readonly string[]) => void>()
  const hook = renderHook(
    ({ draft }) =>
      useTabCompletion({
        inputRef: { current: input },
        draft,
        setDraft,
        complete,
        listCompletions,
      }),
    { initialProps: { draft: input.value } },
  )

  function setDraft(line: string) {
    input.value = line
    hook.rerender({ draft: line })
  }

  async function pressTab() {
    await act(() => hook.result.current())
  }

  return { pressTab, listCompletions }
}

function ambiguous(line: string): Completion {
  return { line, cursor: line.length, matches: ['checkout', 'cherry-pick'] }
}

beforeEach(() => {
  input = document.createElement('input')
  document.body.append(input)
})

afterEach(() => {
  cleanup()
  input.remove()
})

describe('useTabCompletion', () => {
  it('fills in the completion and leaves the caret right after it', async () => {
    typeLine('git sw main', 6)
    const complete = vi.fn((line: string, cursor: number) =>
      Promise.resolve(line === 'git sw main' && cursor === 6 ? { line: 'git switch main', cursor: 11, matches: ['switch'] } : null),
    )
    const { pressTab } = renderTabCompletion(complete)

    await pressTab()

    expect(input.value).toBe('git switch main')
    expect(input.selectionStart).toBe(11)
  })

  it('lists the choices only on a second Tab at the same ambiguous line', async () => {
    typeLine('git ch')
    const { pressTab, listCompletions } = renderTabCompletion((line) => Promise.resolve(ambiguous(line)))

    await pressTab()
    expect(listCompletions).not.toHaveBeenCalled()

    await pressTab()
    expect(listCompletions).toHaveBeenCalledWith('git ch', ['checkout', 'cherry-pick'])
  })

  it('lists the choices on the next Tab after a completion stops at an ambiguous point', async () => {
    typeLine('git c')
    const { pressTab, listCompletions } = renderTabCompletion((line) =>
      Promise.resolve(line === 'git c' ? { line: 'git ch', cursor: 6, matches: ['checkout', 'cherry-pick'] } : ambiguous(line)),
    )

    await pressTab()
    expect(input.value).toBe('git ch')

    await pressTab()
    expect(listCompletions).toHaveBeenCalledWith('git ch', ['checkout', 'cherry-pick'])
  })

  it('starts the double-Tab over once the learner types something new', async () => {
    typeLine('git ch')
    const { pressTab, listCompletions } = renderTabCompletion((line) => Promise.resolve(ambiguous(line)))
    await pressTab()

    typeLine('git che')
    await pressTab()

    expect(listCompletions).not.toHaveBeenCalled()
  })

  it('drops a completion that arrives after the learner kept typing', async () => {
    typeLine('git sw')
    const { pressTab } = renderTabCompletion(() => {
      typeLine('git sw ma')
      return Promise.resolve({ line: 'git switch', cursor: 10, matches: ['switch'] })
    })

    await pressTab()

    expect(input.value).toBe('git sw ma')
  })
})
