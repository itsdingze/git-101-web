import { CheckCircle, XCircle, type LucideIcon } from 'lucide-react'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import type { ResolutionVerdict } from '@/components/lesson/conflict-exercise/resolutionCheck'

type Feedback = {
  message: string
  Icon: LucideIcon
  container: string
  iconColor: string
}

const FEEDBACK: Record<ResolutionVerdict, Feedback> = {
  solved: {
    message: 'Resolved. The file reads as one version and every conflict marker is gone.',
    Icon: CheckCircle,
    container: 'bg-accent-green/5 border-accent-green/20',
    iconColor: 'text-accent-green',
  },
  'marker-left': {
    message:
      'A conflict marker is still in the file. Git treats `<<<<<<<`, `=======`, and `>>>>>>>` as ordinary text, so they ship to production unless you delete all three lines yourself.',
    Icon: XCircle,
    container: 'bg-accent-red/5 border-accent-red/20',
    iconColor: 'text-accent-red',
  },
  'wrong-content': {
    message:
      'Every marker is gone, but the lines that survived are not the ones this resolution needs. Read the prompt again and check which version should stay.',
    Icon: XCircle,
    container: 'bg-accent-red/5 border-accent-red/20',
    iconColor: 'text-accent-red',
  },
}

interface ResolutionFeedbackProps {
  id: string
  status: ResolutionVerdict | null
}

export default function ResolutionFeedback({ id, status }: ResolutionFeedbackProps) {
  const feedback = status === null ? null : FEEDBACK[status]

  return (
    <div id={id} role="status" aria-live="polite">
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed ${feedback.container}`}
        >
          <feedback.Icon size={18} className={`shrink-0 ${feedback.iconColor}`} aria-hidden />
          <InlineMarkdown className="text-text-secondary" value={feedback.message} />
        </div>
      )}
    </div>
  )
}
