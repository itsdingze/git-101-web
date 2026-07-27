import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import StepRenderer from '@/components/lesson/StepRenderer'
import NotFound from '@/components/ui/NotFound'
import ContentColumn from '@/components/layout/ContentColumn'
import useLessonPage from './hooks/useLessonPage'
import useLockedFlexHeight from './hooks/useLockedFlexHeight'

export default function LessonPage() {
  const { lessonId } = useParams()
  const { lesson, step, currentStepIndex, parsedId } = useLessonPage(lessonId)
  const topSpacerRef = useLockedFlexHeight(currentStepIndex)
  const stepRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    stepRef.current?.focus()
    stepRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [currentStepIndex])

  if (!lesson || !step) {
    return <NotFound message="The link may be out of date, or that lesson may have moved." />
  }

  return (
    <ContentColumn className="flex-1 flex flex-col">
      <div ref={topSpacerRef} className="flex-2 min-h-16 sm:min-h-24" />
      <div key={currentStepIndex} ref={stepRef} tabIndex={-1} className="outline-none">
        <StepRenderer
          step={step}
          lessonId={parsedId}
        />
      </div>
      <div className="flex-3 min-h-16 sm:min-h-24" />
    </ContentColumn>
  )
}
