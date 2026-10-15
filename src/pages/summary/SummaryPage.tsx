import { Navigate } from 'react-router-dom'
import { NotFound } from '@/components/ui/NotFound'
import { ContentColumn } from '@/components/layout/ContentColumn'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messages } from '@/messages/en'
import { useSummaryPage } from './hooks/useSummaryPage'
import { SummaryHero } from './components/SummaryHero'
import { CourseNextSteps } from './components/CourseNextSteps'
import { SummaryNavigation } from './components/SummaryNavigation'

export function SummaryPage() {
  const { lesson, lessonFinished, nextLesson, courseComplete, completedCount, totalCount } = useSummaryPage()

  useDocumentTitle(lesson ? messages.summary.documentTitle(lesson.title) : messages.app.lessonNotFoundTitle)

  if (!lesson) {
    return <NotFound subject="lesson" />
  }
  if (!lessonFinished) return <Navigate to={`/lesson/${lesson.id}`} replace />

  return (
    <ContentColumn className="py-16 sm:py-20 pb-36 sm:pb-40 flex-1 flex flex-col justify-center gap-12">
      <SummaryHero
        lessonTitle={lesson.title}
        courseComplete={courseComplete}
        completedCount={completedCount}
        totalCount={totalCount}
      />
      {courseComplete && <CourseNextSteps />}
      <SummaryNavigation nextLessonId={nextLesson?.id} />
    </ContentColumn>
  )
}
