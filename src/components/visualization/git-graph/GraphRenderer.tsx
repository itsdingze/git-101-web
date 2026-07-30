import { useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { Stage, PhantomCommit } from '@/types'
import { computeLayout, computeConnections } from './layout'
import { COMMIT_RADIUS, COMMIT_SPACING_Y, LANE_SPACING_X, PADDING, TRANSITION } from './constants'
import describeStage from './describeStage'
import BranchLabel from './components/BranchLabel'

interface GraphRendererProps {
  stage: Stage
  svgHeight: number
  svgWidth: number
}

export default function GraphRenderer({ stage, svgHeight, svgWidth }: GraphRendererProps) {
  const prefersReduced = useReducedMotion()
  const instant = { enter: { duration: 0 }, exit: { duration: 0 } }
  const transition = prefersReduced ? instant : TRANSITION

  const positions = useMemo(
    () => computeLayout(stage, svgHeight),
    [stage, svgHeight],
  )

  const connections = useMemo(
    () => computeConnections(stage, positions),
    [stage, positions],
  )

  const branchColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const b of stage.branches) map[b.name] = b.color
    return map
  }, [stage.branches])

  const branchHeads = useMemo(() => {
    const heads: Record<string, string> = {}
    for (const b of stage.branches) if (b.startsAt) heads[b.name] = b.startsAt
    for (const commit of stage.commits) heads[commit.branch] = commit.id
    return heads
  }, [stage.branches, stage.commits])

  const phantoms = useMemo((): PhantomCommit[] => {
    return stage.branches
      .filter((b) => b.startsAt && !stage.commits.some((c) => c.branch === b.name))
      .map((branch) => {
        const from = positions[branch.startsAt!]
        if (!from) return null
        const x = PADDING.left + branch.lane * LANE_SPACING_X
        const y = from.y - COMMIT_SPACING_Y
        const midY = (from.y + y) / 2
        const pathD = from.x === x
          ? `M ${from.x} ${from.y} L ${x} ${y}`
          : `M ${from.x} ${from.y} C ${from.x} ${midY}, ${x} ${midY}, ${x} ${y}`
        return { branch, x, y, pathD }
      })
      .filter((p): p is PhantomCommit => p !== null)
  }, [stage.branches, stage.commits, positions])

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="mx-auto"
      role="img"
      aria-label={describeStage(stage)}
    >
      {/* Layer 1: Connections */}
      <AnimatePresence>
        {connections.map((conn) => (
          <motion.path
            key={conn.id}
            d={conn.pathD}
            stroke={conn.color}
            strokeWidth={2}
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: transition.exit }}
            transition={transition.enter}
          />
        ))}
        {phantoms.map(({ branch, pathD }) => (
          <motion.path
            key={`phantom-line-${branch.name}`}
            d={pathD}
            stroke={branch.color}
            strokeWidth={2}
            strokeDasharray="4 3"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: transition.exit }}
            transition={transition.enter}
          />
        ))}
      </AnimatePresence>

      {/* Layer 2: Commits + phantom commit text */}
      <AnimatePresence>
        {stage.commits.map((commit) => {
          const pos = positions[commit.id]
          if (!pos) return null
          const color = branchColorMap[commit.branch] || branchColorMap.main

          return (
            <motion.g
              key={`${commit.id}-${commit.branch}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: transition.exit }}
              transition={transition.enter}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={COMMIT_RADIUS}
                fill={color}
              />
              <text
                x={pos.x + COMMIT_RADIUS + 10}
                y={pos.y}
                dominantBaseline="central"
                fontFamily="var(--font-mono, monospace)"
                fontSize={12}
                fill="var(--color-text-secondary, #94a3b8)"
                stroke="var(--color-bg-primary, #fff)"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {commit.message}
              </text>
            </motion.g>
          )
        })}
        {phantoms.map(({ branch, x, y }) => (
          <motion.text
            key={`phantom-text-${branch.name}`}
            x={x + COMMIT_RADIUS + 10}
            y={y}
            dominantBaseline="central"
            fontFamily="var(--font-mono, monospace)"
            fontSize={12}
            fontStyle="italic"
            fill="var(--color-text-secondary, #94a3b8)"
            stroke="var(--color-bg-primary, #fff)"
            strokeWidth={4}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: transition.exit }}
            transition={transition.enter}
          >
            New branch created
          </motion.text>
        ))}
      </AnimatePresence>

      {/* Layer 3: Branch labels */}
      <AnimatePresence>
        {stage.branches.map((branch) => {
          const headId = branchHeads[branch.name]
          if (!headId) return null
          const isHead = stage.head === branch.name

          const phantom = phantoms.find((p) => p.branch.name === branch.name)
          const labelX = phantom
            ? phantom.x + COMMIT_RADIUS + 10
            : (positions[headId]?.x ?? 0) + COMMIT_RADIUS + 10
          const labelY = phantom
            ? phantom.y + 22
            : (positions[headId]?.y ?? 0) + 22

          return (
            <motion.g
              key={`label-${branch.name}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: transition.exit }}
              transition={transition.enter}
            >
              <BranchLabel branch={branch} isHead={isHead} x={labelX} y={labelY} />
            </motion.g>
          )
        })}
      </AnimatePresence>
    </svg>
  )
}
