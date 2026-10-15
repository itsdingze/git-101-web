import { useMemo } from 'react'
import type { GitScenario } from '@/types'
import { useScrollableRegion } from '@/components/lesson/reading/hooks/useScrollableRegion'
import { WalkthroughStepper } from '@/components/lesson/reading/visualization/WalkthroughStepper'
import { useStageStepper } from '@/components/lesson/reading/visualization/hooks/useStageStepper'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { computeFixedDimensions } from './layout'
import { CONTAINER_HEIGHT } from './constants'
import { colorBranches } from './colorBranches'
import { GraphRenderer } from './GraphRenderer'
import { messages } from '@/messages/en'

export function GitGraph({ commands, stages: graphStages }: GitScenario) {
  const stages = useMemo(() => graphStages.map(colorBranches), [graphStages])
  const { index: stageIndex, atStart, atEnd, next, previous } = useStageStepper(stages.length)
  const { ref, regionProps } = useScrollableRegion<HTMLDivElement>(messages.reading.graph.region, stageIndex)

  const { svgHeight, svgWidth } = useMemo(() => computeFixedDimensions(stages), [stages])

  const stage = stages[stageIndex]
  if (!stage) return null

  const commandDisplay = atStart ? (
    <span className="text-text-muted italic text-sm">{messages.reading.graph.initialState}</span>
  ) : (
    <span className="text-text-primary font-mono text-sm">
      $ {commands[stageIndex - 1]}
    </span>
  )

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div
        ref={ref}
        {...regionProps}
        className={`overflow-auto rounded ${FOCUS_RING}`}
        style={{ maxHeight: `${CONTAINER_HEIGHT}px` }}
      >
        <GraphRenderer
          stage={stage}
          svgHeight={svgHeight}
          svgWidth={svgWidth}
        />
      </div>

      <WalkthroughStepper onPrev={previous} onNext={next} atStart={atStart} atEnd={atEnd}>
        {commandDisplay}
      </WalkthroughStepper>
    </div>
  )
}
