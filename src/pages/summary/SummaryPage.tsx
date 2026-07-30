import NotFound from '@/components/ui/NotFound'
import ContentColumn from '@/components/layout/ContentColumn'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useSummaryPage from './hooks/useSummaryPage'
import SummaryHero from './components/SummaryHero'
import CommandsList from './components/CommandsList'
import SummaryNavigation from './components/SummaryNavigation'

export default function SummaryPage() {
  const { lesson, commands, nextLesson } = useSummaryPage()

  useDocumentTitle(lesson ? `${lesson.title} complete — Git 101` : 'Lesson not found — Git 101')

  if (!lesson) {
    return <NotFound message="The link may be out of date, or that lesson may have moved." />
  }

  return (
    <ContentColumn className="py-16 sm:py-20 pb-36 sm:pb-40 flex-1 flex flex-col justify-center">
      <SummaryHero lessonTitle={lesson.title} />
      <CommandsList commands={commands} />
      <SummaryNavigation nextLessonId={nextLesson?.id} />
    </ContentColumn>
  )
}
