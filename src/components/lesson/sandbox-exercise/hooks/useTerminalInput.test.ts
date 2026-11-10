// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Completion } from '@/lib/git-sim/input/completion'
import type { TerminalSession } from '@/components/lesson/sandbox-exercise/model/terminalSession'
import { useTerminalInput } from './useTerminalInput'

function TerminalHarness({ session, attempt }: { session: TerminalSession; attempt: number }) {
  const { inputRef, draft, setDraft, handleKeyDown, pressTouchKey } = useTerminalInput(session, attempt)
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
    echoCancelled: vi.fn<(line: string) => void>(),
  }
  const { rerender } = render(createElement(TerminalHarness, { session, attempt: 0 }))
  const input = screen.getByLabelText<HTMLInputElement>('Command')
  const restart = () => rerender(createElement(TerminalHarness, { session, attempt: 1 }))
  return { session, input, restart }
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

  it('keeps a half-typed line when ArrowDown is pressed with nothing to recall', () => {
    const { input } = openTerminal()
    type(input, 'git init')
    fireEvent.keyDown(input, { key: 'Enter' })
    type(input, 'git sta')

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(input.value).toBe('git sta')
  })

  it('restores the line being typed after browsing history', () => {
    const { input } = openTerminal()
    type(input, 'git init')
    fireEvent.keyDown(input, { key: 'Enter' })
    type(input, 'abc')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('git init')
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(input.value).toBe('abc')
  })

  it('does not run a line while an IME is still composing it', () => {
    const { session, input } = openTerminal()
    type(input, 'git commit -m "ni')

    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })

    expect(session.submit).not.toHaveBeenCalled()
    expect(input.value).toBe('git commit -m "ni')
  })

  it('does not run a line on the Enter that WebKit reports just after composition ends', () => {
    const { session, input } = openTerminal()
    type(input, 'git commit -m "ni')

    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })

    expect(session.submit).not.toHaveBeenCalled()
  })

  it('clears the half-typed line when the attempt restarts, and keeps earlier commands', () => {
    const { input, restart } = openTerminal()
    type(input, 'git init')
    fireEvent.keyDown(input, { key: 'Enter' })
    type(input, 'half typed')

    restart()

    expect(input.value).toBe('')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('git init')
  })

  it('cancels the line on Ctrl+C by echoing it and clearing it, without adding it to history', () => {
    const { session, input } = openTerminal()
    type(input, 'git init')
    fireEvent.keyDown(input, { key: 'Enter' })
    type(input, 'git sta')

    fireEvent.keyDown(input, { key: 'c', ctrlKey: true })

    expect(session.echoCancelled).toHaveBeenCalledWith('git sta')
    expect(input.value).toBe('')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('git init')
  })

  it('leaves Ctrl+C to copy when part of the line is selected', () => {
    const { session, input } = openTerminal()
    type(input, 'git status')
    input.setSelectionRange(0, 3)

    const keepDefault = fireEvent.keyDown(input, { key: 'c', ctrlKey: true })

    expect(keepDefault).toBe(true)
    expect(session.echoCancelled).not.toHaveBeenCalled()
    expect(input.value).toBe('git status')
  })

  it('forgets the oldest commands of a very long session', () => {
    const { input } = openTerminal()
    for (let command = 0; command < 1000; command += 1) {
      type(input, `command ${command}`)
      fireEvent.keyDown(input, { key: 'Enter' })
    }

    for (let press = 0; press < 1000; press += 1) fireEvent.keyDown(input, { key: 'ArrowUp' })

    expect(input.value).not.toBe('command 0')
    expect(input.value).toMatch(/^command \d+$/)
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
