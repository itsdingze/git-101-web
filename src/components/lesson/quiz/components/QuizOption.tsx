import type { KeyboardEvent, Ref } from 'react'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { FOCUS_RING } from '@/components/ui/focusRing'
import type { SlotTone } from '@/components/lesson/quiz/model/slotTone'

const TONE_STYLES: Record<SlotTone, string> = {
  idle: 'border-border bg-bg-primary',
  selected: 'border-accent-blue-light bg-accent-blue-tint',
  wrong: 'border-accent-red bg-accent-red-tint',
  correct: 'border-accent-green bg-accent-green-tint',
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
      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm leading-relaxed
        ${FOCUS_RING} ${TONE_STYLES[tone]}
        ${locked ? 'cursor-default' : 'cursor-pointer hover:border-text-muted'}`}
    >
      <InlineMarkdown as="span" className="text-text-secondary" value={text} />
    </button>
  )
}
