import { messages } from '@/messages/en'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Lesson } from '@/types'
import { Button } from '@/components/ui/Button'

interface CourseCallToActionProps {
  nextLesson: Lesson | undefined
  hasStarted: boolean
}

export function CourseCallToAction({ nextLesson, hasStarted }: CourseCallToActionProps) {
  if (!nextLesson) {
    return <p className="text-sm font-medium text-accent-green-strong">{messages.home.hero.allFinished}</p>
  }

  return (
    <Button as={Link} to={`/lesson/${nextLesson.id}`} variant="filled" className="max-w-full">
      <span className="truncate">{hasStarted ? messages.home.hero.continue(nextLesson.title) : messages.home.hero.start}</span>
      <ArrowRight size={14} className="shrink-0" aria-hidden />
    </Button>
  )
}
