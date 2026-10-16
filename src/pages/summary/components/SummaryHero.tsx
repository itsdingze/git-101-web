import { CheckCircle, Trophy } from 'lucide-react'
import { messages } from '@/messages/en'

interface SummaryHeroProps {
  lessonTitle: string
  courseComplete: boolean
  completedCount: number
  totalCount: number
}

export function SummaryHero({ lessonTitle, courseComplete, completedCount, totalCount }: SummaryHeroProps) {
  const Icon = courseComplete ? Trophy : CheckCircle

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-green-tint">
        <Icon size={28} className="text-accent-green" aria-hidden />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {courseComplete ? messages.summary.courseFinished : messages.summary.lessonComplete}
        </h1>

        <div className="flex flex-col gap-1">
          <p className="text-base text-text-secondary leading-relaxed">
            {courseComplete ? messages.summary.lessonCompletePrefix : messages.summary.finishedLessonPrefix}
            <span className="font-medium text-text-primary">{lessonTitle}</span>
          </p>

          <p className="text-sm text-text-muted">
            {messages.summary.lessonsDone(completedCount, totalCount)}
          </p>
        </div>
      </div>
    </div>
  )
}
