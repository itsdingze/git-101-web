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

export function useTerminalInput(session: TerminalSession): TerminalInput {
  const inputRef = useRef<HTMLInputElement>(null)
  const { draft, setDraft, previous, next, takeDraft } = useCommandHistory()
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
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const action = terminalKeyAction(event)
    if (!action) return
    if (action !== 'leave') event.preventDefault()
    actions[action]()
  }

  function pressTouchKey(key: TouchKey) {
    inputRef.current?.focus({ preventScroll: true })
    actions[key]()
  }

  return { inputRef, draft, setDraft, handleKeyDown, pressTouchKey }
}
