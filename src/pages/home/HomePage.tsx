import { messages } from '@/messages/en'
import { ContentColumn } from '@/components/layout/ContentColumn'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useHomePage } from './hooks/useHomePage'
import { LessonCard } from './components/LessonCard'
import { CourseIntro } from './components/CourseIntro'

export function HomePage() {
  useDocumentTitle(messages.home.documentTitle)

  const { lessons, nextLesson, hasStarted } = useHomePage()

  return (
    <ContentColumn className="flex flex-col gap-10 py-12 sm:py-16">
      <CourseIntro nextLesson={nextLesson} hasStarted={hasStarted} />

      <div className="flex flex-col gap-1">
        {lessons.map(({ lesson, isCompleted, isCurrent }, position) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            position={position}
            isCompleted={isCompleted}
            isCurrent={isCurrent}
          />
        ))}
      </div>
    </ContentColumn>
  )
}
