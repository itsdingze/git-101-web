import { Link } from 'react-router-dom'
import { ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'

interface SummaryNavigationProps {
  nextLessonId: number | undefined
}

export function SummaryNavigation({ nextLessonId }: SummaryNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Button as={Link} variant="outlined" to="/">
        <Home size={14} />
        {messages.summary.allLessons}
      </Button>

      {nextLessonId !== undefined && (
        <Button as={Link} variant="filled" to={`/lesson/${nextLessonId}`}>
          {messages.summary.nextLesson}
          <ArrowRight size={14} />
        </Button>
      )}
    </div>
  )
}
