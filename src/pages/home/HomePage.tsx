import useProgressStore from '@/stores/progressStore'
import lessons from '@/data/lessons/index'
import ContentColumn from '@/components/layout/ContentColumn'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import LessonCard from './components/LessonCard'

export default function HomePage() {
  useDocumentTitle('Git 101 — Interactive Tutorial')

  // Subscribe to the state itself, not the action refs — those never change,
  // so selecting them would leave the list stale after progress updates.
  const completedLessons = useProgressStore((s) => s.completedLessons)

  const nextId = lessons.find((lesson) => !completedLessons.includes(lesson.id))?.id

  return (
    <ContentColumn className="py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary tracking-tight leading-tight">
          Learn Git
        </h1>
        <p className="text-base text-text-muted mt-2 leading-relaxed">
          Interactive lessons to master version control
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            isCompleted={completedLessons.includes(lesson.id)}
            isCurrent={lesson.id === nextId}
          />
        ))}
      </div>
    </ContentColumn>
  )
}
