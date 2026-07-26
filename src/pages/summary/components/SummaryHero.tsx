import { CheckCircle } from 'lucide-react'

interface SummaryHeroProps {
  lessonTitle: string
}

export default function SummaryHero({ lessonTitle }: SummaryHeroProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-green/10 mb-6">
        <CheckCircle size={28} className="text-accent-green" />
      </div>

      <h1 className="text-2xl font-semibold text-text-primary mb-2 tracking-tight">
        Nice work!
      </h1>

      <p className="text-base text-text-secondary leading-relaxed">
        You finished <span className="font-medium text-text-primary">{lessonTitle}</span>
      </p>
    </div>
  )
}
