import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLessonNav } from '@/hooks/useLessonNav'
import Button from '@/components/ui/Button'
import ContentColumn from './ContentColumn'
import useLessonFooterAction from './hooks/useLessonFooterAction'

export default function LessonFooter() {
  const { showLessonNav, onPrev, canGoPrev } = useLessonNav()
  const { variant, label, showContinue, disabled, onClick } = useLessonFooterAction()

  if (!showLessonNav) return null

  return (
    <footer className="sticky bottom-0 z-50 w-full bg-bg-primary border-t border-border">
      <ContentColumn className="h-20 flex items-center">
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="outlined"
            onClick={onPrev ?? undefined}
            disabled={!canGoPrev}
            className="shrink-0 whitespace-nowrap"
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
      </ContentColumn>
    </footer>
  )
}
