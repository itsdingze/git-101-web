import { type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'

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
      <Button variant="outlined" size="icon" onClick={onPrev} disabled={atStart} aria-label={messages.reading.stepper.previous} className="shrink-0">
        <ChevronLeft size={16} />
      </Button>

      <div className="min-w-0 flex-1 text-center break-words" aria-live="polite">{children}</div>

      <Button variant="outlined" size="icon" onClick={onNext} disabled={atEnd} aria-label={messages.reading.stepper.next} className="shrink-0">
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}
