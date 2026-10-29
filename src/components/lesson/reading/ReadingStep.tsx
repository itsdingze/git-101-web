import { Suspense, useRef } from 'react'
import type { ReadingStep as ReadingStepType } from '@/types'
import { useExerciseNav } from '@/components/lesson/hooks/useExerciseNav'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { ContentBlockList } from './components/ContentBlockList'
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

      <div ref={diagramRef} className="scroll-mt-8">
        <Suspense fallback={<div className="min-h-48 bg-bg-card rounded-xl animate-pulse" />}>
          {step.visualization && <StepDiagram visualization={step.visualization} />}
        </Suspense>
      </div>
    </div>
  )
}
