import { type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'

const control =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary ' +
  'enabled:hover:bg-bg-card enabled:cursor-pointer ' +
  'disabled:opacity-30 disabled:cursor-not-allowed ' +
  `${FOCUS_RING} ` +
  'transition-colors'

interface WalkthroughStepperProps {
  onPrev: () => void
  onNext: () => void
  atStart: boolean
  atEnd: boolean
  children: ReactNode
}

export function WalkthroughStepper({ onPrev, onNext, atStart, atEnd, children }: WalkthroughStepperProps) {
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
      <button type="button" onClick={onPrev} disabled={atStart} aria-label={messages.reading.stepper.previous} className={control}>
        <ChevronLeft size={16} />
      </button>

      <div className="min-w-0 flex-1 text-center break-words" aria-live="polite">{children}</div>

      <button type="button" onClick={onNext} disabled={atEnd} aria-label={messages.reading.stepper.next} className={control}>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
