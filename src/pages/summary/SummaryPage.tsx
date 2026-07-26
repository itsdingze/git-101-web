import NotFound from '@/components/ui/NotFound'
import useSummaryPage from './hooks/useSummaryPage'
import SummaryHero from './components/SummaryHero'
import CommandsList from './components/CommandsList'
import SummaryNavigation from './components/SummaryNavigation'

export default function SummaryPage() {
  const { lesson, commands, nextLesson } = useSummaryPage()

  if (!lesson) {
    return <NotFound message="The link may be out of date, or that lesson may have moved." />
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-6 sm:px-8 py-16 sm:py-20 pb-36 sm:pb-40 flex-1 flex flex-col justify-center">
      <SummaryHero lessonTitle={lesson.title} />
      <CommandsList commands={commands} />
      <SummaryNavigation nextLessonId={nextLesson?.id} />
    </div>
  )
}
