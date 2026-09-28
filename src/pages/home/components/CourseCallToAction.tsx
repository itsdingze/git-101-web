import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Lesson } from '@/types'
import Button from '@/components/ui/Button'

interface CourseCallToActionProps {
  nextLesson: Lesson | undefined
  hasStarted: boolean
}

export default function CourseCallToAction({ nextLesson, hasStarted }: CourseCallToActionProps) {
  if (!nextLesson) {
    return <p className="mt-6 text-sm font-medium text-accent-green">You finished every lesson. Revisit any of them below.</p>
  }

  return (
    <Button as={Link} to={`/lesson/${nextLesson.id}`} variant="filled" className="mt-6 max-w-full">
      <span className="truncate">{hasStarted ? `Continue: ${nextLesson.title}` : 'Start the course'}</span>
      <ArrowRight size={14} className="shrink-0" aria-hidden />
    </Button>
  )
}
