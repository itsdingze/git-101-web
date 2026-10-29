import type { Branch, Stage, Position, Connection, PhantomCommit } from './types'
import {
  COMMIT_RADIUS,
  COMMIT_SPACING_Y,
  LANE_SPACING_X,
  PADDING,
  CHAR_WIDTH,
  HEAD_LABEL,
} from './constants'
import { messages } from '@/messages/en'

export function computeLayout(stage: Stage, svgHeight: number): Record<string, Position> {
  const branchLaneMap: Record<string, number> = {}
  for (const b of stage.branches) {
    branchLaneMap[b.name] = b.lane
  }

  const positions: Record<string, Position> = {}
  const baseY = svgHeight - PADDING.bottom - COMMIT_RADIUS

  for (const [i, commit] of stage.commits.entries()) {
    const lane = branchLaneMap[commit.branch] ?? 0

    positions[commit.id] = {
      x: PADDING.left + lane * LANE_SPACING_X,
      y: baseY - i * COMMIT_SPACING_Y,
    }
  }

  return positions
}

export function branchColorOf(stage: Stage, branchName: string): string {
  const colorOf = (name: string) => stage.branches.find((branch) => branch.name === name)?.color
  return colorOf(branchName) ?? colorOf('main') ?? 'var(--color-text-muted)'
}

export function curvePath(from: Position, to: Position): string {
  if (from.x === to.x) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  const midY = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
}

export function computeConnections(stage: Stage, positions: Record<string, Position>): Connection[] {
  const connections: Connection[] = []

  for (const commit of stage.commits) {
    for (const parentId of commit.parents) {
      const from = positions[parentId]
      const to = positions[commit.id]
      if (!from || !to) continue

      connections.push({ id: `${parentId}-${commit.id}`, pathD: curvePath(from, to), color: branchColorOf(stage, commit.branch) })
    }
  }

  return connections
}

export function branchHeads(stage: Stage): Record<string, string> {
  const heads: Record<string, string> = {}
  for (const branch of stage.branches) if (branch.startsAt) heads[branch.name] = branch.startsAt
  for (const commit of stage.commits) heads[commit.branch] = commit.id
  return heads
}

function emptyBranches(stage: Stage): Branch[] {
  return stage.branches.filter(
    (branch) => branch.startsAt && !stage.commits.some((commit) => commit.branch === branch.name),
  )
}

export function phantomCommits(stage: Stage, positions: Record<string, Position>): PhantomCommit[] {
  return emptyBranches(stage).flatMap((branch) => {
    const from = branch.startsAt ? positions[branch.startsAt] : undefined
    if (!from) return []
    const x = PADDING.left + branch.lane * LANE_SPACING_X
    const y = from.y - COMMIT_SPACING_Y
    return [{ branch, x, y, pathD: curvePath(from, { x, y }) }]
  })
}

export function computeFixedDimensions(stages: Stage[]): { svgHeight: number; svgWidth: number } {
  let maxCommits = 0
  let maxRightExtent = 0

  const textOffset = COMMIT_RADIUS + 10
  const branchAndHeadPillPadding = 12 + 4 + HEAD_LABEL.length * CHAR_WIDTH + 12

  for (const s of stages) {
    const laneMap: Record<string, number> = {}
    for (const b of s.branches) {
      laneMap[b.name] = b.lane
    }

    const empty = emptyBranches(s)
    const phantomRows = empty.length > 0 ? 1 : 0
    maxCommits = Math.max(maxCommits, s.commits.length + phantomRows)

    for (const c of s.commits) {
      const lane = laneMap[c.branch] ?? 0
      const x = PADDING.left + lane * LANE_SPACING_X
      const textEnd = x + textOffset + c.message.length * CHAR_WIDTH
      maxRightExtent = Math.max(maxRightExtent, textEnd)
    }

    for (const b of s.branches) {
      const x = PADDING.left + b.lane * LANE_SPACING_X
      const labelEnd = x + textOffset + b.name.length * CHAR_WIDTH + branchAndHeadPillPadding
      maxRightExtent = Math.max(maxRightExtent, labelEnd)
    }

    for (const b of empty) {
      const x = PADDING.left + b.lane * LANE_SPACING_X
      const textEnd = x + textOffset + messages.reading.graph.newBranch.length * CHAR_WIDTH
      maxRightExtent = Math.max(maxRightExtent, textEnd)
      const labelEnd = x + textOffset + b.name.length * CHAR_WIDTH + branchAndHeadPillPadding
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
