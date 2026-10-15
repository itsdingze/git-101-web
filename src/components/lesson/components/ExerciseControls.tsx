import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'

interface ExerciseControlsProps {
  solved: boolean
  onReset: () => void
  children?: ReactNode
}

export function ExerciseControls({ solved, onReset, children }: ExerciseControlsProps) {
  if (solved) return null

  return (
    <div className="flex items-center justify-between">
      <div>{children}</div>
      <Button variant="text" onClick={onReset} size="sm">
        <RotateCcw size={14} />
        {messages.exercise.startOver}
      </Button>
    </div>
  )
}
