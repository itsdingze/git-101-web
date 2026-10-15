import { type RefObject, useRef, useState } from 'react'
import { move } from '@dnd-kit/helpers'
import type { DragDropEventHandlers } from '@dnd-kit/react'
import type { DragOperation, UniqueIdentifier } from '@dnd-kit/abstract'
import { insertIndex } from '@/components/lesson/block-exercise/model/insertIndex'
import type { BlockAnswer } from './useBlockAnswer'

const GLOSSARY_PREFIX = 'avail-'
const SOLUTION_AREA = 'solution-area'

interface BlockDrag {
  zoneRef: RefObject<HTMLDivElement | null>
  activeId: UniqueIdentifier | null
  activeBlock: string | null
  isActiveFromGlossary: boolean
  overSolution: boolean
  insertIndex: number | null
  dragProviderProps: Partial<DragDropEventHandlers>
}

function isFromGlossary(id: UniqueIdentifier | null | undefined): boolean {
  return String(id ?? '').startsWith(GLOSSARY_PREFIX)
}

function blockOf(id: string): string {
  return id.startsWith(GLOSSARY_PREFIX) ? id.slice(GLOSSARY_PREFIX.length) : id
}

function inserted(answer: readonly string[], block: string, index: number): string[] {
  return [...answer.slice(0, index), block, ...answer.slice(index)]
}

export function useBlockDrag({ answer, solved, changeAnswer }: Pick<BlockAnswer, 'answer' | 'solved' | 'changeAnswer'>): BlockDrag {
  const zoneRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [overSolution, setOverSolution] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const overSolutionRef = useRef(false)
  const dropIndexRef = useRef<number | null>(null)
  const answerBeforeDrag = useRef(answer)

  function markOverSolution(isOver: boolean) {
    if (isOver === overSolutionRef.current) return
    overSolutionRef.current = isOver
    setOverSolution(isOver)
  }

  function markDropIndex(index: number | null) {
    if (index === dropIndexRef.current) return
    dropIndexRef.current = index
    setDropIndex(index)
  }

  function pointerDropIndex(pointerX: number): number {
    const blocks = [...(zoneRef.current?.querySelectorAll('[data-block]') ?? [])]
    return insertIndex(blocks.map((block) => block.getBoundingClientRect()), pointerX)
  }

  function trackDropIndex(operation: DragOperation) {
    if (!isFromGlossary(operation.source?.id)) return
    if (!overSolutionRef.current) {
      markDropIndex(null)
      return
    }
    const pointerX = operation.position.current.x
    if (pointerX != null) markDropIndex(pointerDropIndex(pointerX))
  }

  function isOverAnswer(targetId: UniqueIdentifier | undefined): boolean {
    return targetId === SOLUTION_AREA || answer.includes(String(targetId))
  }

  function drop(operation: DragOperation) {
    const { source, target } = operation
    if (!source || !isFromGlossary(source.id) || !target || !isOverAnswer(target.id)) return
    const block = blockOf(String(source.id))
    if (answer.includes(block)) return
    const index = dropIndexRef.current ?? answer.length
    changeAnswer((current) => inserted(current, block, index))
  }

  const dragProviderProps: Partial<DragDropEventHandlers> = {
    onDragStart(event) {
      if (solved) return
      const sourceId = event.operation.source?.id ?? null
      setActiveId(sourceId)
      markOverSolution(!isFromGlossary(sourceId))
      answerBeforeDrag.current = answer
    },
    onDragOver(event) {
      if (!isFromGlossary(event.operation.source?.id)) {
        changeAnswer((current) => move([...current], event))
        return
      }
      markOverSolution(isOverAnswer(event.operation.target?.id))
      trackDropIndex(event.operation)
    },
    onDragMove(event) {
      trackDropIndex(event.operation)
    },
    onDragEnd(event) {
      setActiveId(null)
      markOverSolution(false)
      if (!solved) {
        if (event.operation.canceled) changeAnswer(() => answerBeforeDrag.current)
        else drop(event.operation)
      }
      markDropIndex(null)
    },
  }

  const activeIdText = activeId === null ? null : String(activeId)

  return {
    zoneRef,
    activeId,
    activeBlock: activeIdText === null ? null : blockOf(activeIdText),
    isActiveFromGlossary: isFromGlossary(activeIdText),
    overSolution,
    insertIndex: dropIndex,
    dragProviderProps,
  }
}
