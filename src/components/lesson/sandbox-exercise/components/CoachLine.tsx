import { Check, CircleHelp, Lightbulb, PartyPopper, Target, TriangleAlert, type LucideIcon } from 'lucide-react'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import type { CoachKind } from '@/components/lesson/sandbox-exercise/coachLines'

const COACH_STYLES: Record<CoachKind, { icon: LucideIcon; label: string; accent: string }> = {
  goal: { icon: Target, label: 'Goal', accent: 'border-terminal-branch text-terminal-branch' },
  done: { icon: Check, label: 'Done', accent: 'border-terminal-prompt text-terminal-prompt' },
  tip: { icon: Lightbulb, label: 'Tip', accent: 'border-terminal-minimize text-terminal-minimize' },
  warning: { icon: TriangleAlert, label: 'Warning', accent: 'border-accent-orange text-accent-orange' },
  hint: { icon: CircleHelp, label: 'Hint', accent: 'border-terminal-muted text-terminal-muted' },
  complete: { icon: PartyPopper, label: 'Complete', accent: 'border-terminal-prompt text-terminal-prompt' },
}

interface CoachLineProps {
  kind: CoachKind
  text: string
}

export default function CoachLine({ kind, text }: CoachLineProps) {
  const { icon: Icon, label, accent } = COACH_STYLES[kind]

  return (
    <div className={`my-2 flex items-start gap-2 border-l-2 py-0.5 pl-3 font-sans ${accent}`}>
      <Icon size={14} className="mt-1 shrink-0" aria-hidden />
      <span className="sr-only">{label}:</span>
      <InlineMarkdown
        as="span"
        className="min-w-0 text-sm leading-relaxed text-terminal-text [&_code]:bg-white/10 [&_code]:text-terminal-text [&_strong]:text-white"
        value={text}
      />
    </div>
  )
}
