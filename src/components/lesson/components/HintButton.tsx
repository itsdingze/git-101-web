import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'

interface HintButtonProps {
  open?: boolean
  onHint: () => void
}

export function HintButton({ open = false, onHint }: HintButtonProps) {
  return (
    <Button variant="text" onClick={onHint} size="sm">
      <HelpCircle size={14} />
      {open ? messages.exercise.hideHint : messages.exercise.showHint}
    </Button>
  )
}
