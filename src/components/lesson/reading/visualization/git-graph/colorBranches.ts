import type { GraphStage } from '@/types'
import type { Stage } from './types'
import { COLORS, LABEL_COLORS } from './constants'

const MAIN_LANE = 0

export function colorBranches(stage: GraphStage): Stage {
  return {
    ...stage,
    branches: stage.branches.map((branch) => {
      const role = branch.lane === MAIN_LANE ? 'main' : 'feature'
      return { ...branch, color: COLORS[role], labelColor: LABEL_COLORS[role] }
    }),
  }
}
