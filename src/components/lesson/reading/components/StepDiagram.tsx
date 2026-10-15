import { lazy } from 'react'
import type { Visualization } from '@/types'

const ThreePlaceModel = lazy(() =>
  import('@/components/lesson/reading/visualization/ThreePlaceModel').then((m) => ({ default: m.ThreePlaceModel })),
)
const GitGraph = lazy(() =>
  import('@/components/lesson/reading/visualization/git-graph/GitGraph').then((m) => ({ default: m.GitGraph })),
)

interface StepDiagramProps {
  visualization: Visualization
}

export function StepDiagram({ visualization }: StepDiagramProps) {
  switch (visualization.kind) {
    case 'three-place-model':
      return <ThreePlaceModel {...visualization} />
    case 'git-graph':
      return <GitGraph {...visualization} />
  }
}
