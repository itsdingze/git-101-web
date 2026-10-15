import { Check, CircleHelp, Lightbulb, PartyPopper, Target, TriangleAlert, type LucideIcon } from 'lucide-react'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import type { CoachKind } from '@/components/lesson/sandbox-exercise/model/coachLines'
import { messages } from '@/messages/en'

const COACH_STYLES: Record<CoachKind, { icon: LucideIcon; label: string; accent: string }> = {
  goal: { icon: Target, label: messages.sandbox.coach.goal, accent: 'border-terminal-branch text-terminal-branch' },
  done: { icon: Check, label: messages.sandbox.coach.done, accent: 'border-terminal-prompt text-terminal-prompt' },
  tip: { icon: Lightbulb, label: messages.sandbox.coach.tip, accent: 'border-terminal-tip text-terminal-tip' },
  warning: { icon: TriangleAlert, label: messages.sandbox.coach.warning, accent: 'border-accent-orange text-accent-orange' },
  hint: { icon: CircleHelp, label: messages.sandbox.coach.hint, accent: 'border-terminal-muted text-terminal-muted' },
  complete: { icon: PartyPopper, label: messages.sandbox.coach.complete, accent: 'border-terminal-prompt text-terminal-prompt' },
}

interface CoachMessageProps {
  kind: CoachKind
  text: string
}

export function CoachMessage({ kind, text }: CoachMessageProps) {
  const { icon: Icon, label, accent } = COACH_STYLES[kind]

  return (
    <div className={`flex items-start gap-2 border-l-2 py-0.5 pl-3 font-sans ${accent}`}>
      <Icon size={14} className="mt-1 shrink-0" aria-hidden />
      <span className="sr-only">{label}:</span>
      <InlineMarkdown
        as="span"
        className="min-w-0 text-sm leading-relaxed text-terminal-text [&_code]:bg-terminal-code-bg [&_code]:text-terminal-text [&_strong]:text-terminal-strong"
        value={text}
      />
    </div>
  )
}
