import { useState } from 'react'
import { NOT_BROWSING, recall } from '@/components/lesson/sandbox-exercise/model/commandHistory'

const MAX_COMMANDS = 200

interface CommandHistory {
  draft: string
  setDraft: (draft: string) => void
  previous: () => void
  next: () => void
  takeDraft: () => string | null
  discardDraft: () => string
}

export function useCommandHistory(attempt: number): CommandHistory {
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<readonly string[]>([])
  const [position, setPosition] = useState(NOT_BROWSING)
  const [typedLine, setTypedLine] = useState('')
  const [seenAttempt, setSeenAttempt] = useState(attempt)

  function clearLine() {
    setPosition(NOT_BROWSING)
    setTypedLine('')
    setDraft('')
  }

  if (attempt !== seenAttempt) {
    setSeenAttempt(attempt)
    clearLine()
  }

  function step(offset: number) {
    const recalled = recall(history, position, offset, typedLine)
    if (!recalled) return
    if (position === NOT_BROWSING) setTypedLine(draft)
    setPosition(recalled.position)
    setDraft(recalled.draft)
  }

  function takeDraft(): string | null {
    const line = draft.trim()
    if (!line) return null
    setHistory((previous) => [...previous, line].slice(-MAX_COMMANDS))
    clearLine()
    return line
  }

  function discardDraft(): string {
    clearLine()
    return draft
  }

  return { draft, setDraft, previous: () => step(-1), next: () => step(1), takeDraft, discardDraft }
}
