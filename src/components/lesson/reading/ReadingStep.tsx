import { Suspense, useRef } from 'react'
import type { ReadingStep as ReadingStepType } from '@/types'
import { useExerciseNav } from '@/components/lesson/hooks/useExerciseNav'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { messages } from '@/messages/en'
import { ContentBlockList } from './components/ContentBlockList'
import { DiagramErrorBoundary } from './components/DiagramErrorBoundary'
import { DiagramJumpLink } from './components/DiagramJumpLink'
import { StepDiagram } from './components/StepDiagram'

interface ReadingStepProps {
  step: ReadingStepType
}

export function ReadingStep({ step }: ReadingStepProps) {
  useExerciseNav({ solved: true })
  const diagramRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-6">
      {step.title && (
        <InlineMarkdown
          as="h2"
          className="text-xl font-semibold text-text-primary tracking-tight"
          value={step.title}
        />
      )}

      {step.visualization && <DiagramJumpLink target={diagramRef} />}

      <ContentBlockList blocks={step.content} />

      <div>
        {step.visualization && (
          <div
            ref={diagramRef}
            role="group"
            aria-label={messages.reading.diagram}
            tabIndex={-1}
            className={`scroll-mt-8 rounded-lg ${FOCUS_RING}`}
          >
            <DiagramErrorBoundary>
              <Suspense fallback={<div className="min-h-48 bg-bg-card rounded-xl motion-safe:animate-pulse" />}>
                <StepDiagram visualization={step.visualization} />
              </Suspense>
            </DiagramErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}
