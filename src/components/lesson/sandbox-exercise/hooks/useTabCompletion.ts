import { type RefObject, useLayoutEffect, useRef } from 'react'
import type { Completion } from '@/lib/git-sim/input/completion'
import { tabAction } from '@/components/lesson/sandbox-exercise/model/tabAction'

interface TabCompletionOptions {
  inputRef: RefObject<HTMLInputElement | null>
  draft: string
  setDraft: (line: string) => void
  complete: (line: string, cursor: number) => Promise<Completion | null>
  listCompletions: (line: string, matches: readonly string[]) => void
}

export function useTabCompletion({
  inputRef,
  draft,
  setDraft,
  complete,
  listCompletions,
}: TabCompletionOptions): () => Promise<void> {
  const previousTabDraft = useRef<string | null>(null)
  const pendingCaret = useRef<number | null>(null)

  useLayoutEffect(() => {
    const caret = pendingCaret.current
    if (caret === null) return
    pendingCaret.current = null
    inputRef.current?.setSelectionRange(caret, caret)
  }, [draft, inputRef])

  return async function completeAtCursor() {
    const input = inputRef.current
    if (!input) return

    const line = input.value
    const completion = await complete(line, input.selectionStart ?? line.length)
    if (!completion || input.value !== line) return

    const action = tabAction(line, previousTabDraft.current, completion)
    previousTabDraft.current = action.type === 'replace' ? action.line : line
    if (action.type === 'replace') {
      pendingCaret.current = action.cursor
      setDraft(action.line)
    }
    if (action.type === 'list') listCompletions(line, action.matches)
  }
}
