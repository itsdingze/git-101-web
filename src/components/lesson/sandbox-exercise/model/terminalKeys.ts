export type TerminalKeyAction = 'complete' | 'previous' | 'next' | 'submit' | 'leave' | 'cancel'

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

function isCtrlC(press: KeyPress): boolean {
  return press.key.toLowerCase() === 'c' && press.ctrlKey && !press.shiftKey && !press.altKey && !press.metaKey
}

export function terminalKeyAction(press: KeyPress): TerminalKeyAction | null {
  if (press.key === 'Tab') {
    const modified = press.shiftKey || press.altKey || press.ctrlKey || press.metaKey
    return modified ? null : 'complete'
  }
  if (isCtrlC(press)) return 'cancel'
  return ACTIONS[press.key] ?? null
}
