import { type RefObject, useEffect, useRef } from 'react'

interface ConflictEditorFocus {
  editorRef: RefObject<HTMLTextAreaElement | null>
  openButtonRef: (path: string) => (button: HTMLButtonElement | null) => void
  returnFocusOnClose: (path: string) => void
}

export function useConflictEditorFocus(openPath: string | undefined): ConflictEditorFocus {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const openButtons = useRef(new Map<string, HTMLButtonElement>())
  const returnFocusTo = useRef<string | null>(null)

  useEffect(() => {
    if (openPath) {
      editorRef.current?.focus()
      return
    }
    if (returnFocusTo.current) openButtons.current.get(returnFocusTo.current)?.focus()
    returnFocusTo.current = null
  }, [openPath])

  function openButtonRef(path: string) {
    return (button: HTMLButtonElement | null) => {
      if (button) openButtons.current.set(path, button)
      else openButtons.current.delete(path)
    }
  }

  function returnFocusOnClose(path: string) {
    returnFocusTo.current = path
  }

  return { editorRef, openButtonRef, returnFocusOnClose }
}
