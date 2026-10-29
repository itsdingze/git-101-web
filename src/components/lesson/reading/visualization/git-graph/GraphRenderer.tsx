import { useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { Stage } from './types'
import { branchColorOf, branchHeads, computeLayout, computeConnections, phantomCommits } from './layout'
import { COMMIT_RADIUS, TRANSITION } from './constants'
import { messages } from '@/messages/en'
import { describeStage } from './describeStage'
import { BranchLabel } from './components/BranchLabel'

interface GraphRendererProps {
  stage: Stage
  svgHeight: number
  svgWidth: number
}

export function GraphRenderer({ stage, svgHeight, svgWidth }: GraphRendererProps) {
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

  const heads = useMemo(() => branchHeads(stage), [stage])

  const phantoms = useMemo(() => phantomCommits(stage, positions), [stage, positions])

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="mx-auto"
      role="img"
      aria-label={describeStage(stage)}
    >
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

      <AnimatePresence>
        {stage.commits.map((commit) => {
          const pos = positions[commit.id]
          if (!pos) return null
          const color = branchColorOf(stage, commit.branch)

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
                fill="var(--color-text-secondary)"
                stroke="var(--color-bg-primary)"
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
            fill="var(--color-text-secondary)"
            stroke="var(--color-bg-primary)"
            strokeWidth={4}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: transition.exit }}
            transition={transition.enter}
          >
            {messages.reading.graph.newBranch}
          </motion.text>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {stage.branches.map((branch) => {
          const headId = heads[branch.name]
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
