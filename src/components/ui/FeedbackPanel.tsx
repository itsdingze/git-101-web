import { CheckCircle, XCircle } from 'lucide-react'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'

type FeedbackTone = 'right' | 'wrong'

const TONES: Record<FeedbackTone, { Icon: typeof CheckCircle; container: string; icon: string }> = {
  right: { Icon: CheckCircle, container: 'bg-accent-green/5 border-accent-green/20', icon: 'text-accent-green' },
  wrong: { Icon: XCircle, container: 'bg-accent-red/5 border-accent-red/20', icon: 'text-accent-red' },
}

interface FeedbackPanelProps {
  tone: FeedbackTone
  message: string
}

export function FeedbackPanel({ tone, message }: FeedbackPanelProps) {
  const { Icon, container, icon } = TONES[tone]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed ${container}`}>
      <Icon size={18} className={`shrink-0 ${icon}`} aria-hidden />
      <InlineMarkdown className="text-text-secondary" value={message} />
    </div>
  )
}
