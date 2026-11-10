import { type KeyboardEvent, type RefObject, useRef } from 'react'
import type { TerminalSession } from '@/components/lesson/sandbox-exercise/model/terminalSession'
import { terminalKeyAction, type TerminalKeyAction } from '@/components/lesson/sandbox-exercise/model/terminalKeys'
import { useCommandHistory } from './useCommandHistory'
import { useTabCompletion } from './useTabCompletion'

type TouchKey = Extract<TerminalKeyAction, 'complete' | 'previous' | 'next'>

interface TerminalInput {
  inputRef: RefObject<HTMLInputElement | null>
  draft: string
  setDraft: (draft: string) => void
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  pressTouchKey: (key: TouchKey) => void
}

function hasSelectedText(input: HTMLInputElement): boolean {
  const selectedInLine = input.selectionStart !== input.selectionEnd
  const selection = window.getSelection()
  return selectedInLine || (selection !== null && !selection.isCollapsed)
}

export function useTerminalInput(session: TerminalSession, attempt: number): TerminalInput {
  const inputRef = useRef<HTMLInputElement>(null)
  const { draft, setDraft, previous, next, takeDraft, discardDraft } = useCommandHistory(attempt)
  const completeAtCursor = useTabCompletion({
    inputRef,
    draft,
    setDraft,
    complete: session.complete,
    listCompletions: session.listCompletions,
  })

  const actions: Record<TerminalKeyAction, () => void> = {
    complete: () => void completeAtCursor(),
    previous,
    next,
    submit: () => {
      const line = takeDraft()
      if (line) session.submit(line)
    },
    leave: () => inputRef.current?.blur(),
    cancel: () => session.echoCancelled(discardDraft()),
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // WebKit ends composition before keydown, leaving keyCode 229 as the only sign of the confirming Enter.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    const action = terminalKeyAction(event)
    if (!action) return
    if (action === 'cancel' && hasSelectedText(event.currentTarget)) return
    if (action !== 'leave') event.preventDefault()
    actions[action]()
  }

  function pressTouchKey(key: TouchKey) {
    inputRef.current?.focus({ preventScroll: true })
    actions[key]()
  }

  return { inputRef, draft, setDraft, handleKeyDown, pressTouchKey }
}
