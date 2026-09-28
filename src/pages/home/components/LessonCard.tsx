import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import type { Lesson } from '@/types'
import lessonMinutes from '@/pages/home/lessonMinutes'

interface LessonCardProps {
  lesson: Lesson
  isCompleted: boolean
  isCurrent: boolean
}

export default function LessonCard({ lesson, isCompleted, isCurrent }: LessonCardProps) {
  return (
    <Link to={`/lesson/${lesson.id}`} className="no-underline block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
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
              ? 'bg-accent-green text-white'
              : 'bg-bg-card text-text-secondary border border-border'}
          `}
        >
          {isCompleted ? (
            <Check size={16} strokeWidth={2.5} />
          ) : (
            <span>{lesson.id}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-primary leading-snug">
            {lesson.title}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {lesson.description}
          </p>
          <p className="text-xs text-text-muted mt-1">About {lessonMinutes(lesson)} min</p>
        </div>

        <ChevronRight size={16} className="text-text-muted shrink-0" />
      </div>
    </Link>
  )
}
