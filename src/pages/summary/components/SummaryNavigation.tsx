import { Link } from 'react-router-dom'
import { ArrowRight, Home } from 'lucide-react'
import Button from '@/components/ui/Button'

interface SummaryNavigationProps {
  nextLessonId: number | undefined
}

export default function SummaryNavigation({ nextLessonId }: SummaryNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12">
      <Button as={Link} variant="outlined" to="/">
        <Home size={14} />
        All Lessons
      </Button>

      {nextLessonId !== undefined && (
        <Button as={Link} variant="filled" to={`/lesson/${nextLessonId}`}>
          Next Lesson
          <ArrowRight size={14} />
        </Button>
      )}
    </div>
  )
}
