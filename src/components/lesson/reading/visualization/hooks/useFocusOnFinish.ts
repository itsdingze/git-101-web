import { useEffect, useRef, type RefObject } from 'react'

export function useFocusOnFinish<T extends HTMLElement>(finished: boolean): RefObject<T | null> {
  const ref = useRef<T>(null)
  const wasFinished = useRef(finished)

  useEffect(() => {
    if (finished && !wasFinished.current) ref.current?.focus()
    wasFinished.current = finished
  }, [finished])

  return ref
}
