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
    const content = contentRef.current
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

    let learnerHasActed = false
    const markLearnerActed = () => {
      learnerHasActed = true
    }
    content?.addEventListener('pointerdown', markLearnerActed)
    content?.addEventListener('keydown', markLearnerActed)

    let lockedAgainstHeight = content?.getBoundingClientRect().height ?? 0
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0
      if (Math.abs(height - lockedAgainstHeight) < 1) return
      lockedAgainstHeight = height
      if (!learnerHasActed) relock()
    })
    if (content) observer.observe(content)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', relock)
      content?.removeEventListener('pointerdown', markLearnerActed)
      content?.removeEventListener('keydown', markLearnerActed)
      observer.disconnect()
      release()
    }
  }, [resetKey])

  return { spacerRef, contentRef }
}
