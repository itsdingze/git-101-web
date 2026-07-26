import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLessonNav } from '@/hooks/useLessonNav'
import Button from '@/components/ui/Button'

export default function LessonFooter() {
  const {
    showLessonNav,
    onPrev,
    onNext,
    canGoPrev,
    isLastStep,
    stepCompleted,
    checkDisabled,
    checkResult,
    triggerCheck,
  } = useLessonNav()

  if (!showLessonNav) return null

  const isIncorrect = checkResult === 'incorrect'
  const showContinue = checkResult === 'correct' || stepCompleted

  const variant = checkResult === 'correct' ? 'filled-success' : isIncorrect ? 'filled-danger' : 'filled'
  const label = showContinue
    ? isLastStep
      ? 'Finish Lesson'
      : 'Continue'
    : isIncorrect
      ? 'Try Again'
      : 'Check Answer'
  const onClick = showContinue ? onNext ?? undefined : triggerCheck
  const disabled = isIncorrect || (!showContinue && checkDisabled)

  return (
    <footer className="sticky bottom-0 z-50 w-full bg-white/95 backdrop-blur-sm border-t border-border">
      <div className="w-full px-6 sm:px-8 h-20 flex items-center justify-center">
        <div className="flex items-center gap-2 w-full max-w-xl">
          {/* Back sizes to its label; the primary action takes the rest so
              neither wraps on narrow screens */}
          <Button
            variant="outlined"
            onClick={onPrev ?? undefined}
            disabled={!canGoPrev}
            className="shrink-0 whitespace-nowrap !px-4 sm:!px-5"
          >
            <ArrowLeft size={14} />
            Go Back
          </Button>

          <Button
            variant={variant}
            onClick={onClick}
            disabled={disabled}
            className="flex-1 whitespace-nowrap"
          >
            {label}
            {showContinue && <ArrowRight size={14} />}
          </Button>
        </div>
      </div>
    </footer>
  )
}
