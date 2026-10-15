import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import type { Lesson } from '@/types'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { lessonMinutes } from '@/pages/home/lessonMinutes'
import { messages } from '@/messages/en'

interface LessonCardProps {
  lesson: Lesson
  position: number
  isCompleted: boolean
  isCurrent: boolean
}

export function LessonCard({ lesson, position, isCompleted, isCurrent }: LessonCardProps) {
  return (
    <Link to={`/lesson/${lesson.id}`} className={`no-underline block rounded-xl ${FOCUS_RING}`}>
      <div
        className={`
          flex items-center gap-4 px-5 py-4 rounded-xl border transition-colors duration-150
          hover:bg-bg-secondary cursor-pointer
          ${isCurrent
            ? 'border-text-primary/20 bg-bg-secondary shadow-sm'
            : 'border-transparent hover:border-border'}
        `}
      >
        <div
          className={`
            shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${isCompleted
              ? 'bg-accent-green text-text-on-accent'
              : 'bg-bg-card text-text-secondary border border-border'}
          `}
        >
          {isCompleted ? (
            <>
              <Check size={16} strokeWidth={2.5} aria-hidden />
              <span className="sr-only">{messages.home.card.completed}</span>
            </>
          ) : (
            <span>{position}</span>
          )}
        </div>

        <div className="flex flex-1 min-w-0 flex-col gap-1">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-medium text-text-primary leading-snug">
              {isCurrent && <span className="sr-only">{messages.home.card.upNext}</span>}
              {lesson.title}
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              {lesson.description}
            </p>
          </div>
          <p className="text-xs text-text-muted">{messages.home.card.minutes(lessonMinutes(lesson))}</p>
        </div>

        <ChevronRight size={16} className="text-text-muted shrink-0" />
      </div>
    </Link>
  )
}
