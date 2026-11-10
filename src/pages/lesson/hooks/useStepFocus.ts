import { type RefObject, useEffect } from 'react'

function headingOrContent(content: HTMLElement): HTMLElement {
  const heading = content.querySelector('h2')
  if (!heading) return content
  heading.tabIndex = -1
  return heading
}

export function useStepFocus(contentRef: RefObject<HTMLElement | null>, stepIndex: number): void {
  useEffect(() => {
    if (contentRef.current) headingOrContent(contentRef.current).focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [stepIndex, contentRef])
}
