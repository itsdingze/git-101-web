import type { ReactNode } from 'react'
import { blockShell } from './blockShell'
import { SortableBlock } from './SortableBlock'

interface SolutionBlocksProps {
  answer: readonly string[]
  insertIndex: number | null
  isActiveFromGlossary: boolean
  overSolution: boolean
  activeBlock: string | null
  solved: boolean
  onRemove: (block: string) => void
}

export function SolutionBlocks({ answer, insertIndex, isActiveFromGlossary, overSolution, activeBlock, solved, onRemove }: SolutionBlocksProps) {
  const blocks: ReactNode[] = answer.map((block, i) => (
    <SortableBlock
      key={block}
      id={block}
      index={i}
      onRemove={() => onRemove(block)}
      disabled={solved}
    >
      {block}
    </SortableBlock>
  ))

  if (insertIndex === null || !isActiveFromGlossary || !overSolution) return blocks

  const placeholder = (
    <div key="insert-placeholder" className={`${blockShell} bg-border`}>
      <span className="invisible">{activeBlock}</span>
    </div>
  )
  return [...blocks.slice(0, insertIndex), placeholder, ...blocks.slice(insertIndex)]
}
