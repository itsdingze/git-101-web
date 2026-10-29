// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Completion } from '@/lib/git-sim/input/completion'
import type { TerminalSession } from '@/components/lesson/sandbox-exercise/model/terminalSession'
import { useTerminalInput } from './useTerminalInput'

function TerminalHarness({ session }: { session: TerminalSession }) {
  const { inputRef, draft, setDraft, handleKeyDown, pressTouchKey } = useTerminalInput(session)
  return createElement(
    'div',
    null,
    createElement('input', {
      ref: inputRef,
      'aria-label': 'Command',
      value: draft,
      onChange: (event: { target: { value: string } }) => setDraft(event.target.value),
      onKeyDown: handleKeyDown,
    }),
    createElement('button', { type: 'button', onClick: () => pressTouchKey('previous') }, 'Previous command'),
  )
}

function openTerminal(complete: TerminalSession['complete'] = () => Promise.resolve(null)) {
  const session: TerminalSession = {
    ready: true,
    failed: false,
    retried: false,
    retry: vi.fn<() => void>(),
    lines: [],
    prompt: { directory: '~', branch: null },
    submit: vi.fn<(line: string) => void>(),
    complete,
    listCompletions: vi.fn<(line: string, matches: readonly string[]) => void>(),
  }
  render(createElement(TerminalHarness, { session }))
  const input = screen.getByLabelText<HTMLInputElement>('Command')
  return { session, input }
}

function type(input: HTMLInputElement, line: string) {
  fireEvent.change(input, { target: { value: line } })
}

afterEach(cleanup)

describe('useTerminalInput', () => {
  it('runs the typed command on Enter and clears the line', () => {
    const { session, input } = openTerminal()

    type(input, '  git status  ')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(session.submit).toHaveBeenCalledWith('git status')
    expect(input.value).toBe('')
  })

  it('runs nothing for a blank line', () => {
    const { session, input } = openTerminal()

    type(input, '   ')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(session.submit).not.toHaveBeenCalled()
  })

  it('brings back earlier commands with the arrow keys', () => {
    const { input } = openTerminal()
    type(input, 'git init')
    fireEvent.keyDown(input, { key: 'Enter' })
    type(input, 'git status')
    fireEvent.keyDown(input, { key: 'Enter' })

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('git init')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.value).toBe('')
  })

  it('completes on Tab instead of moving focus out of the terminal', async () => {
    const complete = (line: string): Promise<Completion> =>
      Promise.resolve({ line: `${line}it`, cursor: line.length + 2, matches: ['init'] })
    const { input } = openTerminal(complete)
    type(input, 'git in')

    let moveFocus = true
    await act(async () => {
      moveFocus = fireEvent.keyDown(input, { key: 'Tab' })
      await Promise.resolve()
    })

    expect(moveFocus).toBe(false)
    expect(input.value).toBe('git init')
  })

  it('lets go of the keyboard on Escape', () => {
    const { input } = openTerminal()
    input.focus()

    const keepDefault = fireEvent.keyDown(input, { key: 'Escape' })

    expect(keepDefault).toBe(true)
    expect(document.activeElement).not.toBe(input)
  })

  it('focuses the line and recalls a command from the on-screen key', () => {
    const { input } = openTerminal()
    type(input, 'git log')
    fireEvent.keyDown(input, { key: 'Enter' })
    input.blur()

    fireEvent.click(screen.getByRole('button', { name: 'Previous command' }))

    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('git log')
  })
})
