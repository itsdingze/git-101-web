import { useParams } from 'react-router-dom'
import { StepRenderer } from '@/components/lesson/StepRenderer'
import { NotFound } from '@/components/ui/NotFound'
import { ContentColumn } from '@/components/layout/ContentColumn'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messages } from '@/messages/en'
import { StepSpacer } from './components/StepSpacer'
import { useLessonPage } from './hooks/useLessonPage'
import { useStepSpacer } from './hooks/useStepSpacer'
import { useStepFocus } from './hooks/useStepFocus'

export function LessonPage() {
  const { lessonId } = useParams()
  const { lesson, step, currentStepIndex, parsedId } = useLessonPage(lessonId)
  const { spacerRef, contentRef } = useStepSpacer(currentStepIndex)

  useDocumentTitle(lesson ? messages.lessonPage.documentTitle(lesson.title) : messages.app.lessonNotFoundTitle)
  useStepFocus(contentRef, currentStepIndex)

  if (!lesson || !step) {
    return <NotFound subject="lesson" />
  }

  return (
    <ContentColumn className="flex-1 flex flex-col">
      <h1 className="sr-only">{lesson.title}</h1>
      <StepSpacer ref={spacerRef} grow="flex-2" />
      <div key={currentStepIndex} ref={contentRef} tabIndex={-1} className="shrink-0 outline-none">
        <StepRenderer
          step={step}
          lessonId={parsedId}
        />
      </div>
      <StepSpacer grow="flex-3" />
    </ContentColumn>
  )
}
