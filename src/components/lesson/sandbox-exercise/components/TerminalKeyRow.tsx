import type { MouseEvent } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'

interface TerminalKeyRowProps {
  onComplete: () => void
  onPrevious: () => void
  onNext: () => void
}

function keepInputFocused(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

export function TerminalKeyRow({ onComplete, onPrevious, onNext }: TerminalKeyRowProps) {
  return (
    <div className="hidden gap-2 pointer-coarse:flex">
      <Button variant="outlined" onMouseDown={keepInputFocused} onClick={onComplete} aria-label={messages.sandbox.keys.tabLabel}>
        {messages.sandbox.keys.tab}
      </Button>
      <Button variant="outlined" onMouseDown={keepInputFocused} onClick={onPrevious} aria-label={messages.sandbox.keys.previousLabel}>
        <ArrowUp size={16} aria-hidden />
        {messages.sandbox.keys.previous}
      </Button>
      <Button variant="outlined" onMouseDown={keepInputFocused} onClick={onNext} aria-label={messages.sandbox.keys.nextLabel}>
        <ArrowDown size={16} aria-hidden />
        {messages.sandbox.keys.next}
      </Button>
    </div>
  )
}
