export type TerminalKeyAction = 'complete' | 'previous' | 'next' | 'submit' | 'leave'

interface KeyPress {
  key: string
  shiftKey: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

const ACTIONS: Record<string, TerminalKeyAction> = {
  ArrowUp: 'previous',
  ArrowDown: 'next',
  Enter: 'submit',
  Escape: 'leave',
}

export function terminalKeyAction(press: KeyPress): TerminalKeyAction | null {
  if (press.key === 'Tab') {
    const modified = press.shiftKey || press.altKey || press.ctrlKey || press.metaKey
    return modified ? null : 'complete'
  }
  return ACTIONS[press.key] ?? null
}
