import type { KeyboardEvent, Ref } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { FOCUS_RING } from '@/components/ui/focusRing'
import type { SlotTone } from '@/components/lesson/quiz/model/slotTone'
import { messages } from '@/messages/en'

const TONE_STYLES: Record<SlotTone, string> = {
  idle: 'border-border bg-bg-primary',
  selected: 'border-accent-blue bg-accent-blue-tint',
  wrong: 'border-accent-red bg-accent-red-tint',
  correct: 'border-accent-green bg-accent-green-tint',
}

const VERDICTS: Partial<Record<SlotTone, { Icon: typeof CheckCircle; color: string; label: string }>> = {
  wrong: { Icon: XCircle, color: 'text-accent-red', label: messages.quiz.optionWrong },
  correct: { Icon: CheckCircle, color: 'text-accent-green', label: messages.quiz.optionCorrect },
}

interface QuizOptionProps {
  text: string
  tone: SlotTone
  checked: boolean
  tabIndex: 0 | -1
  locked: boolean
  optionRef: Ref<HTMLButtonElement>
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function QuizOption({ text, tone, checked, tabIndex, locked, optionRef, onSelect, onKeyDown }: QuizOptionProps) {
  const verdict = VERDICTS[tone]

  return (
    <button
      ref={optionRef}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      disabled={locked}
      className={`flex w-full items-start justify-between gap-3 text-left px-4 py-3 rounded-xl border transition-colors text-sm leading-relaxed
        ${FOCUS_RING} ${TONE_STYLES[tone]}
        ${locked ? 'cursor-default' : 'cursor-pointer hover:border-text-muted'}`}
    >
      <InlineMarkdown as="span" className="text-text-secondary" value={text} />
      {verdict && (
        <span className="shrink-0">
          <verdict.Icon size={18} className={verdict.color} aria-hidden />
          <span className="sr-only">{verdict.label}</span>
        </span>
      )}
    </button>
  )
}
