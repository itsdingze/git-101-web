import { useId } from 'react'
import type { QuizStep as QuizStepType } from '@/types'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { FeedbackPanel } from '@/components/ui/FeedbackPanel'
import { Shake } from '@/components/lesson/components/Shake'
import { QuizOption } from './components/QuizOption'
import { useQuizStep } from './hooks/useQuizStep'

interface QuizStepProps {
  step: QuizStepType
  lessonId: number
}

export function QuizStep({ step, lessonId }: QuizStepProps) {
  const questionId = useId()
  const { slots, completed, feedback, shaking, select, pressKey, slotRef } = useQuizStep(step, lessonId)

  return (
    <div className="space-y-6">
      <InlineMarkdown
        as="h2"
        id={questionId}
        className="text-base font-semibold text-text-primary leading-snug"
        value={step.question}
      />

      <Shake shaking={shaking} role="radiogroup" aria-labelledby={questionId} className="space-y-3">
        {slots.map(({ option, tone, checked, tabIndex }, slot) => (
          <QuizOption
            key={option.text}
            text={option.text}
            tone={tone}
            checked={checked}
            tabIndex={tabIndex}
            locked={completed}
            optionRef={slotRef(slot)}
            onSelect={() => select(slot)}
            onKeyDown={(event) => pressKey(slot, event)}
          />
        ))}
      </Shake>

      <div role="status" aria-live="polite">
        {feedback && <FeedbackPanel tone="wrong" message={feedback} />}
        {completed && <FeedbackPanel tone="right" message={step.explanation} />}
      </div>
    </div>
  )
}
