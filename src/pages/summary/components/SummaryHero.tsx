import { CheckCircle, Trophy } from 'lucide-react'

interface SummaryHeroProps {
  lessonTitle: string
  courseComplete: boolean
  completedCount: number
  totalCount: number
}

export default function SummaryHero({ lessonTitle, courseComplete, completedCount, totalCount }: SummaryHeroProps) {
  const Icon = courseComplete ? Trophy : CheckCircle

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-green/10 mb-6">
        <Icon size={28} className="text-accent-green" aria-hidden />
      </div>

      <h1 className="text-2xl font-semibold text-text-primary mb-2 tracking-tight">
        {courseComplete ? 'You finished Git 101' : 'Nice work!'}
      </h1>

      <p className="text-base text-text-secondary leading-relaxed">
        You finished <span className="font-medium text-text-primary">{lessonTitle}</span>
      </p>

      <p className="text-sm text-text-muted mt-1">
        {completedCount} of {totalCount} lessons done
      </p>
    </div>
  )
}
