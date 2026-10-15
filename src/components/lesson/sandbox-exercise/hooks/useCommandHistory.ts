import { useState } from 'react'
import { NOT_BROWSING, recall } from '@/components/lesson/sandbox-exercise/model/commandHistory'

interface CommandHistory {
  draft: string
  setDraft: (draft: string) => void
  previous: () => void
  next: () => void
  takeDraft: () => string | null
}

export function useCommandHistory(): CommandHistory {
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<readonly string[]>([])
  const [position, setPosition] = useState(NOT_BROWSING)

  function step(offset: number) {
    const recalled = recall(history, position, offset)
    if (!recalled) return
    setPosition(recalled.position)
    setDraft(recalled.draft)
  }

  function takeDraft(): string | null {
    const line = draft.trim()
    if (!line) return null
    setHistory((previous) => [...previous, line])
    setPosition(NOT_BROWSING)
    setDraft('')
    return line
  }

  return { draft, setDraft, previous: () => step(-1), next: () => step(1), takeDraft }
}
