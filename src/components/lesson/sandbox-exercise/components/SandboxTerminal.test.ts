// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { TerminalSession } from '@/components/lesson/sandbox-exercise/model/terminalSession'
import { messages } from '@/messages/en'
import { SandboxTerminal } from './SandboxTerminal'

function failedSession(retry: () => void): TerminalSession {
  return {
    ready: false,
    failed: true,
    retried: false,
    retry,
    lines: [],
    prompt: { directory: '~', branch: null },
    submit: vi.fn(),
    complete: vi.fn(() => Promise.resolve(null)),
    listCompletions: vi.fn(),
    echoCancelled: vi.fn(),
  }
}

function readySession(): TerminalSession {
  return {
    ...failedSession(vi.fn()),
    ready: true,
    failed: false,
    lines: [{ id: 1, kind: 'stdout', text: 'a1b2c3 first commit' }],
  }
}

function terminal(session: TerminalSession, focusRequest = 0) {
  return createElement(SandboxTerminal, { session, focusRequest, attempt: 0 })
}

function terminalInput() {
  return screen.getByRole('textbox', { name: messages.sandbox.input })
}

function terminalOutput() {
  return screen.getByRole('log', { name: messages.sandbox.output })
}

beforeAll(() => {
  Element.prototype.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
})

afterEach(() => {
  window.getSelection()?.removeAllRanges()
  cleanup()
})

describe('SandboxTerminal', () => {
  it('says the terminal did not load and sets it up again on retry', () => {
    const retry = vi.fn()
    render(terminal(failedSession(retry)))

    expect(screen.getByRole('alert').textContent).toBe(messages.sandbox.setupFailed)
    expect(screen.queryByText(messages.sandbox.settingUp)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: messages.sandbox.retrySetup }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('has the failure alert on the page before setup can fail', () => {
    render(terminal({ ...failedSession(vi.fn()), failed: false }))

    expect(screen.getByRole('alert').textContent).toBe('')
  })

  it('leaves focus alone when the terminal becomes ready', () => {
    render(terminal(readySession()))

    expect(document.activeElement).not.toBe(terminalInput())
  })

  it('focuses the input when the learner asks for it, such as by saving a file', () => {
    const session = readySession()
    const { rerender } = render(terminal(session))

    rerender(terminal(session, 1))

    expect(document.activeElement).toBe(terminalInput())
  })

  it('focuses the input when the learner clicks the terminal', () => {
    render(terminal(readySession()))

    fireEvent.click(terminalOutput())

    expect(document.activeElement).toBe(terminalInput())
  })

  it('keeps text the learner selected in the output when the mouse is released', () => {
    render(terminal(readySession()))
    window.getSelection()?.selectAllChildren(terminalOutput())

    fireEvent.click(terminalOutput())

    expect(document.activeElement).not.toBe(terminalInput())
    expect(window.getSelection()?.isCollapsed).toBe(false)
  })
})
