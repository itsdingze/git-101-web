import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'
import { ContentColumn } from './ContentColumn'
import { useLessonFooterAction } from './hooks/useLessonFooterAction'

export function LessonFooter() {
  const { showLessonNav, onPrev, canGoPrev } = useLessonNav()
  const { variant, label, showContinue, disabled, onClick } = useLessonFooterAction()

  if (!showLessonNav) return null

  return (
    <footer data-lesson-footer className="sticky bottom-0 z-50 w-full bg-bg-primary border-t border-border">
      <ContentColumn className="min-h-20 flex items-center py-3">
        <div className="flex flex-wrap items-center gap-2 w-full">
          <Button
            variant="outlined"
            onClick={onPrev ?? undefined}
            disabled={!canGoPrev}
            className="shrink-0 whitespace-nowrap"
          >
            <ArrowLeft size={14} />
            {messages.footer.goBack}
          </Button>

          <Button
            variant={variant}
            onClick={onClick}
            disabled={disabled}
            className="grow basis-32 whitespace-nowrap"
          >
            {label}
            {showContinue && <ArrowRight size={14} />}
          </Button>
        </div>
      </ContentColumn>
    </footer>
  )
}
