import { lazy, Suspense, useRef, type ComponentType } from 'react'
import type { ReadingStep as ReadingStepType, VisualizationType } from '@/types'
import useExerciseNav from '@/hooks/useExerciseNav'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import ContentBlock from './components/ContentBlock'
import DiagramJumpLink from './components/DiagramJumpLink'
import blockKey from './components/blockKey'

const ThreePlaceModel = lazy(() => import('@/components/visualization/ThreePlaceModel'))
const GitGraph = lazy(() => import('@/components/visualization/git-graph/GitGraph'))
const ConflictMarkers = lazy(() => import('@/components/visualization/ConflictMarkers'))
const DiffWalkthrough = lazy(() => import('@/components/visualization/DiffWalkthrough'))
const ResetWalkthrough = lazy(() => import('@/components/visualization/ResetWalkthrough'))
const RestoreWalkthrough = lazy(() => import('@/components/visualization/RestoreWalkthrough'))

/** git-graph is handled separately — it is the only visualization taking a prop. */
const VISUALIZATIONS: Record<Exclude<VisualizationType, 'git-graph'>, ComponentType> = {
  'three-place-model': ThreePlaceModel,
  'conflict-markers': ConflictMarkers,
  'diff-walkthrough': DiffWalkthrough,
  'reset-walkthrough': ResetWalkthrough,
  'restore-walkthrough': RestoreWalkthrough,
}

interface ReadingStepProps {
  step: ReadingStepType
}

export default function ReadingStep({ step }: ReadingStepProps) {
  useExerciseNav({ solved: true })
  const diagramRef = useRef<HTMLDivElement>(null)

  const Visualization =
    step.visualization && step.visualization !== 'git-graph'
      ? VISUALIZATIONS[step.visualization]
      : undefined

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

      {step.content.map((block, index) => (
        <ContentBlock key={blockKey(block, index)} block={block} />
      ))}

      <div ref={diagramRef} className="scroll-mt-24">
        <Suspense fallback={<div className="min-h-48 bg-bg-card rounded-xl animate-pulse" />}>
          {step.visualization === 'git-graph' && <GitGraph scenario={step.visualizationVariant} />}
          {Visualization && <Visualization />}
        </Suspense>
      </div>
    </div>
  )
}
