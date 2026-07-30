import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import StepRenderer from '@/components/lesson/StepRenderer'
import NotFound from '@/components/ui/NotFound'
import ContentColumn from '@/components/layout/ContentColumn'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useLessonPage from './hooks/useLessonPage'
import useStepSpacer from './hooks/useStepSpacer'

export default function LessonPage() {
  const { lessonId } = useParams()
  const { lesson, step, currentStepIndex, parsedId } = useLessonPage(lessonId)
  const { spacerRef, contentRef } = useStepSpacer(currentStepIndex)

  useDocumentTitle(lesson ? `${lesson.title} — Git 101` : 'Lesson not found — Git 101')

  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentStepIndex, contentRef])

  if (!lesson || !step) {
    return <NotFound message="The link may be out of date, or that lesson may have moved." />
  }

  return (
    <ContentColumn className="flex-1 flex flex-col">
      <h1 className="sr-only">{lesson.title}</h1>
      <div ref={spacerRef} className="flex-2 min-h-[min(4rem,9dvh)] sm:min-h-[min(6rem,14dvh)]" />
      <div key={currentStepIndex} ref={contentRef} tabIndex={-1} className="shrink-0 outline-none">
        <StepRenderer
          step={step}
          lessonId={parsedId}
        />
      </div>
      <div className="flex-3 min-h-[min(4rem,9dvh)] sm:min-h-[min(6rem,14dvh)]" />
    </ContentColumn>
  )
}
