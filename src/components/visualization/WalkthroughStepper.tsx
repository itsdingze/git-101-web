import { type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const control =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary ' +
  'enabled:hover:bg-bg-card enabled:cursor-pointer ' +
  'disabled:opacity-30 disabled:cursor-not-allowed ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ' +
  'transition-colors'

interface WalkthroughStepperProps {
  onPrev: () => void
  onNext: () => void
  atStart: boolean
  atEnd: boolean
  children: ReactNode
}

export default function WalkthroughStepper({ onPrev, onNext, atStart, atEnd, children }: WalkthroughStepperProps) {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' && !atStart) {
      e.preventDefault()
      onPrev()
    } else if (e.key === 'ArrowRight' && !atEnd) {
      e.preventDefault()
      onNext()
    }
  }

  return (
    <div className="flex items-center gap-2" onKeyDown={handleKeyDown}>
      <button type="button" onClick={onPrev} disabled={atStart} aria-label="Previous step" className={control}>
        <ChevronLeft size={16} />
      </button>

      <div className="min-w-0 flex-1 text-center break-words">{children}</div>

      <button type="button" onClick={onNext} disabled={atEnd} aria-label="Next step" className={control}>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
