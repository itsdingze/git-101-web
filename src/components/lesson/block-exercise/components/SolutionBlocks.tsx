import type { ReactNode } from 'react'
import blockShell from './blockShell'
import SortableBlock from './SortableBlock'

interface SolutionBlocksProps {
  answer: string[]
  insertIndex: number | null
  isActiveFromGlossary: boolean
  overSolution: boolean
  activeBlock: string | null
  solved: boolean
  onRemove: (block: string) => void
}

export default function SolutionBlocks({ answer, insertIndex, isActiveFromGlossary, overSolution, activeBlock, solved, onRemove }: SolutionBlocksProps) {
  const showPlaceholder = insertIndex !== null && isActiveFromGlossary && overSolution
  const children: ReactNode[] = []

  for (let i = 0; i <= answer.length; i++) {
    if (showPlaceholder && insertIndex === i) {
      children.push(
        <div
          key="insert-placeholder"
          className={`${blockShell} bg-border`}
        >
          <span className="invisible">{activeBlock}</span>
        </div>
      )
    }
    if (i < answer.length) {
      const block = answer[i]!
      children.push(
        <SortableBlock
          key={block}
          id={block}
          index={i}
          onRemove={() => onRemove(block)}
          disabled={solved}
        >
          {block}
        </SortableBlock>
      )
    }
  }

  return children
}
