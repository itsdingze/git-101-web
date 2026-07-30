import { HelpCircle, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'
import InlineMarkdown from '@/components/ui/InlineMarkdown'

interface ExerciseControlsProps {
  hints?: readonly string[]
  hintIndex: number
  showHint: boolean
  solved: boolean
  onToggleHint: () => void
  onReset: () => void
}

export default function ExerciseControls({ hints, hintIndex, showHint, solved, onToggleHint, onReset }: ExerciseControlsProps) {
  return (
    <>
      {!solved && (
        <div className="flex items-center justify-between">
          <div>
            {hints && (
              <Button
                variant="text"
                onClick={onToggleHint}
                size="sm"
              >
                <HelpCircle size={14} />
                {showHint ? 'Hide hint' : 'Need a hint?'}
              </Button>
            )}
          </div>
          <Button
            variant="text"
            onClick={onReset}
            size="sm"
          >
            <RotateCcw size={14} />
            Start over
          </Button>
        </div>
      )}

      {showHint && !solved && hints && (
        <InlineMarkdown
          as="div"
          className="bg-bg-secondary border border-border rounded-xl px-5 py-3.5 text-sm text-text-secondary leading-relaxed"
          value={hints[Math.min(hintIndex, hints.length - 1)] ?? ''}
        />
      )}
    </>
  )
}
