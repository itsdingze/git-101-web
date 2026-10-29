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
  }
}

beforeAll(() => {
  Element.prototype.scrollTo = () => {}
})

afterEach(cleanup)

describe('SandboxTerminal', () => {
  it('says the terminal did not load and sets it up again on retry', () => {
    const retry = vi.fn()
    render(createElement(SandboxTerminal, { session: failedSession(retry), focusRequest: 0 }))

    expect(screen.getByRole('alert').textContent).toBe(messages.sandbox.setupFailed)
    expect(screen.queryByText(messages.sandbox.settingUp)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: messages.sandbox.retrySetup }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
