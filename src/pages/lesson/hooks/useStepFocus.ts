import { type RefObject, useEffect } from 'react'

export function useStepFocus(contentRef: RefObject<HTMLElement | null>, stepIndex: number): void {
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [stepIndex, contentRef])
}
