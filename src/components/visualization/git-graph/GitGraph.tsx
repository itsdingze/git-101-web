import { useState, useMemo, useCallback } from 'react'
import type { ScenarioKey } from '@/types'
import useScrollableRegion from '@/hooks/useScrollableRegion'
import WalkthroughStepper from '@/components/visualization/WalkthroughStepper'
import { SCENARIOS } from './scenarios'
import { computeFixedDimensions } from './layout'
import { CONTAINER_HEIGHT } from './constants'
import GraphRenderer from './GraphRenderer'

interface GitGraphProps {
  scenario?: ScenarioKey
}

export default function GitGraph({ scenario = 'branching' }: GitGraphProps) {
  const [stageIndex, setStageIndex] = useState(0)
  const { ref, regionProps } = useScrollableRegion<HTMLDivElement>('Commit graph', stageIndex)

  const config = SCENARIOS[scenario]

  // Fixed SVG dimensions: max across all stages so commits stay anchored
  const { svgHeight, svgWidth } = useMemo(() => {
    if (!config) return { svgHeight: 0, svgWidth: 0 }
    return computeFixedDimensions(config.stages)
  }, [config])

  const totalStages = config?.stages.length ?? 0

  const goForward = useCallback(() => {
    setStageIndex((s) => Math.min(s + 1, totalStages - 1))
  }, [totalStages])

  const goBackward = useCallback(() => {
    setStageIndex((s) => Math.max(s - 1, 0))
  }, [])

  if (!config) return null

  const stage = config.stages[stageIndex]!
  const atStart = stageIndex === 0
  const atEnd = stageIndex === totalStages - 1

  const commandDisplay = atStart ? (
    <span className="text-text-muted italic text-sm">Initial state</span>
  ) : (
    <span className="text-text-primary font-mono text-sm">
      $ {config.commands[stageIndex - 1]}
    </span>
  )

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div
        ref={ref}
        {...regionProps}
        className="overflow-auto rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        style={{ maxHeight: `${CONTAINER_HEIGHT}px` }}
      >
        <GraphRenderer
          stage={stage}
          svgHeight={svgHeight}
          svgWidth={svgWidth}
        />
      </div>

      <WalkthroughStepper onPrev={goBackward} onNext={goForward} atStart={atStart} atEnd={atEnd}>
        {commandDisplay}
      </WalkthroughStepper>
    </div>
  )
}
