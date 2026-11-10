import { type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'

const STEP_BUTTON =
  'shrink-0 aria-disabled:cursor-not-allowed aria-disabled:text-border ' +
  'aria-disabled:hover:bg-transparent aria-disabled:active:bg-transparent'

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
      <Button
        variant="outlined"
        size="icon"
        onClick={atStart ? undefined : onPrev}
        aria-disabled={atStart}
        aria-label={messages.reading.stepper.previous}
        className={STEP_BUTTON}
      >
        <ChevronLeft size={16} />
      </Button>

      <div className="min-w-0 flex-1 text-center break-words" aria-live="polite">{children}</div>

      <Button
        variant="outlined"
        size="icon"
        onClick={atEnd ? undefined : onNext}
        aria-disabled={atEnd}
        aria-label={messages.reading.stepper.next}
        className={STEP_BUTTON}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}
