import type { Stage, Position, Connection } from '@/types'
import {
  COMMIT_RADIUS,
  COMMIT_SPACING_Y,
  LANE_SPACING_X,
  PADDING,
  CHAR_WIDTH,
} from './constants'

/**
 * Bottom-up layout: index 0 (oldest commit) at the bottom of the SVG,
 * newest commits grow upward. `svgHeight` is fixed per scenario so
 * existing commits stay anchored when new ones appear above.
 */
export function computeLayout(stage: Stage, svgHeight: number): Record<string, Position> {
  const branchLaneMap: Record<string, number> = {}
  for (const b of stage.branches) {
    branchLaneMap[b.name] = b.lane
  }

  const positions: Record<string, Position> = {}
  const commits = stage.commits
  const n = commits.length
  const baseY = svgHeight - PADDING.bottom - COMMIT_RADIUS

  for (let i = 0; i < n; i++) {
    const commit = commits[i]!
    const lane = branchLaneMap[commit.branch] ?? 0

    positions[commit.id] = {
      x: PADDING.left + lane * LANE_SPACING_X,
      y: baseY - i * COMMIT_SPACING_Y,
    }
  }

  return positions
}

export function computeConnections(stage: Stage, positions: Record<string, Position>): Connection[] {
  const branchColorMap: Record<string, string> = {}
  for (const b of stage.branches) {
    branchColorMap[b.name] = b.color
  }

  const connections: Connection[] = []

  for (const commit of stage.commits) {
    for (const parentId of commit.parents) {
      const from = positions[parentId]
      const to = positions[commit.id]
      if (!from || !to) continue

      const color = branchColorMap[commit.branch] ?? branchColorMap.main ?? 'var(--color-text-muted)'
      let pathD: string
      if (from.x === to.x) {
        pathD = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
      } else {
        const midY = (from.y + to.y) / 2
        pathD = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
      }

      connections.push({ id: `${parentId}-${commit.id}`, pathD, color })
    }
  }

  return connections
}

/** Compute fixed SVG dimensions from all stages of a scenario. */
export function computeFixedDimensions(stages: Stage[]): { svgHeight: number; svgWidth: number } {
  let maxCommits = 0
  let maxRightExtent = 0

  const textOffset = COMMIT_RADIUS + 10
  const labelPad = 12 + 4 + 4 * CHAR_WIDTH + 12 // branch pill padding + gap + HEAD pill
  const phantomText = 'New branch created'

  for (const s of stages) {
    const laneMap: Record<string, number> = {}
    for (const b of s.branches) {
      laneMap[b.name] = b.lane
    }

    // Detect empty branches (phantom commits add an extra row)
    const emptyBranches = s.branches.filter(
      (b) => b.startsAt && !s.commits.some((c) => c.branch === b.name),
    )
    const phantomRows = emptyBranches.length > 0 ? 1 : 0
    maxCommits = Math.max(maxCommits, s.commits.length + phantomRows)

    for (const c of s.commits) {
      const lane = laneMap[c.branch] ?? 0
      const x = PADDING.left + lane * LANE_SPACING_X
      const textEnd = x + textOffset + c.message.length * CHAR_WIDTH
      maxRightExtent = Math.max(maxRightExtent, textEnd)
    }

    for (const b of s.branches) {
      const x = PADDING.left + b.lane * LANE_SPACING_X
      const labelEnd = x + textOffset + b.name.length * CHAR_WIDTH + labelPad
      maxRightExtent = Math.max(maxRightExtent, labelEnd)
    }

    // Phantom commit text width
    for (const b of emptyBranches) {
      const x = PADDING.left + b.lane * LANE_SPACING_X
      const textEnd = x + textOffset + phantomText.length * CHAR_WIDTH
      maxRightExtent = Math.max(maxRightExtent, textEnd)
      const labelEnd = x + textOffset + b.name.length * CHAR_WIDTH + labelPad
      maxRightExtent = Math.max(maxRightExtent, labelEnd)
    }
  }

  const svgHeight =
    PADDING.top +
    COMMIT_RADIUS +
    (maxCommits - 1) * COMMIT_SPACING_Y +
    COMMIT_RADIUS +
    PADDING.bottom

  const svgWidth = maxRightExtent + PADDING.left

  return { svgHeight, svgWidth }
}
