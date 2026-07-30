import { type RefObject, useRef, useLayoutEffect } from 'react'

interface StepSpacer {
  spacerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
}

export default function useStepSpacer(resetKey: unknown): StepSpacer {
  const spacerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const spacer = spacerRef.current
    if (!spacer) return

    const release = () => {
      spacer.style.flexGrow = ''
      spacer.style.flexBasis = ''
    }

    const lock = () => {
      release()
      const height = spacer.getBoundingClientRect().height
      spacer.style.flexGrow = '0'
      spacer.style.flexBasis = `${height}px`
    }

    let frame = 0
    const relock = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(lock)
    }

    lock()
    relock()
    window.addEventListener('resize', relock)

    let lockedAgainstHeight = contentRef.current?.getBoundingClientRect().height ?? 0
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0
      if (Math.abs(height - lockedAgainstHeight) < 1) return
      lockedAgainstHeight = height
      relock()
    })
    if (contentRef.current) observer.observe(contentRef.current)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', relock)
      observer.disconnect()
      release()
    }
  }, [resetKey])

  return { spacerRef, contentRef }
}
