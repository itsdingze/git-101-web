import { type RefObject, useEffect, useRef, useState } from 'react'
import { move } from '@dnd-kit/helpers'
import type { DragDropEventHandlers } from '@dnd-kit/react'
import type { DragOperation, UniqueIdentifier } from '@dnd-kit/abstract'
import { blockOf, isFromGlossary } from '@/components/lesson/block-exercise/model/blockDragId'
import { dropAnnouncement } from '@/components/lesson/block-exercise/model/dragAnnouncement'
import { focusDroppedBlock } from '@/components/lesson/block-exercise/model/handOffFocus'
import { insertIndex } from '@/components/lesson/block-exercise/model/insertIndex'
import { messages } from '@/messages/en'
import type { BlockAnswer } from './useBlockAnswer'

const SOLUTION_AREA = 'solution-area'

interface BlockDrag {
  zoneRef: RefObject<HTMLDivElement | null>
  activeId: UniqueIdentifier | null
  activeBlock: string | null
  isActiveFromGlossary: boolean
  overSolution: boolean
  insertIndex: number | null
  announcement: string
  dragProviderProps: Partial<DragDropEventHandlers>
}

function inserted(answer: readonly string[], block: string, index: number): string[] {
  return [...answer.slice(0, index), block, ...answer.slice(index)]
}

export function useBlockDrag({ answer, solved, changeAnswer }: Pick<BlockAnswer, 'answer' | 'solved' | 'changeAnswer'>): BlockDrag {
  const zoneRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [overSolution, setOverSolution] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const overSolutionRef = useRef(false)
  const dropIndexRef = useRef<number | null>(null)
  const answerBeforeDrag = useRef(answer)
  const blockAwaitingFocus = useRef<string | null>(null)

  useEffect(() => {
    if (activeId !== null || blockAwaitingFocus.current === null) return
    focusDroppedBlock(zoneRef.current, blockAwaitingFocus.current)
    blockAwaitingFocus.current = null
  }, [activeId])

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

  function drop(operation: DragOperation): boolean {
    const { source, target } = operation
    if (!source || !isFromGlossary(source.id) || !target || !isOverAnswer(target.id)) return false
    const block = blockOf(source.id)
    if (answer.includes(block)) return false
    const index = dropIndexRef.current ?? answer.length
    changeAnswer((current) => inserted(current, block, index))
    return true
  }

  function announceMoveWithinAnswer(block: string, targetId: UniqueIdentifier | undefined) {
    const position = answer.indexOf(String(targetId))
    if (position >= 0) setAnnouncement(messages.blocks.movedTo(block, position + 1, answer.length))
  }

  function announceGlossaryCrossing(block: string, isOver: boolean) {
    if (isOver === overSolutionRef.current) return
    setAnnouncement(isOver ? messages.blocks.overAnswer(block) : messages.blocks.offAnswer(block))
  }

  const dragProviderProps: Partial<DragDropEventHandlers> = {
    onDragStart(event) {
      if (solved) return
      const sourceId = event.operation.source?.id ?? null
      setActiveId(sourceId)
      markOverSolution(!isFromGlossary(sourceId))
      answerBeforeDrag.current = answer
      if (sourceId !== null) setAnnouncement(messages.blocks.pickedUp(blockOf(sourceId)))
    },
    onDragOver(event) {
      const { source, target } = event.operation
      const block = blockOf(source?.id ?? '')
      if (!isFromGlossary(source?.id)) {
        announceMoveWithinAnswer(block, target?.id)
        changeAnswer((current) => move([...current], event))
        return
      }
      const isOver = isOverAnswer(target?.id)
      announceGlossaryCrossing(block, isOver)
      markOverSolution(isOver)
      trackDropIndex(event.operation)
    },
    onDragMove(event) {
      trackDropIndex(event.operation)
    },
    onDragEnd(event) {
      setActiveId(null)
      markOverSolution(false)
      const { source, canceled } = event.operation
      let added = false
      if (!solved) {
        if (canceled) changeAnswer(() => answerBeforeDrag.current)
        else added = drop(event.operation)
      }
      markDropIndex(null)
      if (source?.id === undefined) return
      const block = blockOf(source.id)
      blockAwaitingFocus.current = block
      setAnnouncement(
        dropAnnouncement({
          block,
          canceled,
          fromGlossary: isFromGlossary(source.id),
          added,
          position: answer.indexOf(block) + 1,
          total: answer.length,
        }),
      )
    },
  }

  return {
    zoneRef,
    activeId,
    activeBlock: activeId === null ? null : blockOf(activeId),
    isActiveFromGlossary: isFromGlossary(activeId),
    overSolution,
    insertIndex: dropIndex,
    announcement,
    dragProviderProps,
  }
}
