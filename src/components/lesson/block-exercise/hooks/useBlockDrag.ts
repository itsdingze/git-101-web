import { type Dispatch, type SetStateAction, useState, useRef } from 'react'
import { move } from '@dnd-kit/helpers'
import type { DragDropEventHandlers } from '@dnd-kit/react'
import type { DragOperation } from '@dnd-kit/abstract'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'
import type { BlockExerciseStep } from '@/types'

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function computeInsertIndex(pointerX: number): number {
  const zone = document.querySelector('[data-solution-zone]')
  if (!zone) return 0
  const blocks = zone.querySelectorAll('[data-block]')
  if (blocks.length === 0) return 0
  for (let i = 0; i < blocks.length; i++) {
    const rect = blocks[i]!.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    if (pointerX < centerX) return i
  }
  return blocks.length
}

interface UseBlockDragReturn {
  answer: string[]
  solved: boolean
  showHint: boolean
  hintIndex: number
  shakeSlots: boolean
  activeId: string | number | null
  activeBlock: string | null
  isActiveFromGlossary: boolean
  overSolution: boolean
  insertIndex: number | null
  handleBlockClick: (block: string) => void
  handleRemoveFromAnswer: (block: string) => void
  handleReset: () => void
  setShowHint: Dispatch<SetStateAction<boolean>>
  dragProviderProps: Partial<DragDropEventHandlers>
}

export default function useBlockDrag(step: BlockExerciseStep, lessonId: number): UseBlockDragReturn {
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])

  const [answer, setAnswer] = useState<string[]>(isCompleted ? [...step.correctAnswer] : [])
  const [solved, setSolved] = useState(isCompleted)
  const [showHint, setShowHint] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [shakeSlots, setShakeSlots] = useState(false)
  const [activeId, setActiveId] = useState<string | number | null>(null)
  const [overSolution, setOverSolution] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const overSolutionRef = useRef(false)
  const insertIndexRef = useRef<number | null>(null)
  const previousAnswer = useRef(answer)

  function handleReset() {
    setAnswer([])
    setSolved(false)
    setShowHint(false)
    setHintIndex(0)
    setShakeSlots(false)
    setActiveId(null)
    setOverSolution(false)
    setInsertIndex(null)
    overSolutionRef.current = false
    insertIndexRef.current = null
  }

  function handleCheck() {
    const isCorrect =
      arraysEqual(answer, step.correctAnswer) ||
      (step.acceptableAnswers?.some((alt) => arraysEqual(answer, alt)) ?? false)

    if (isCorrect) {
      setSolved(true)
      completeStep(lessonId, step.id)
      return true
    }

    setShakeSlots(true)
    setTimeout(() => setShakeSlots(false), 500)
    setHintIndex((i) => Math.min(i + 1, (step.hints?.length || 1) - 1))
    return false
  }

  useExerciseNav({ solved, checkFn: handleCheck, checkDisabled: answer.length === 0 })

  function updateInsertIndex(operation: DragOperation) {
    const sourceId = String(operation.source?.id ?? '')
    if (!sourceId.startsWith('avail-')) return

    if (!overSolutionRef.current) {
      if (insertIndexRef.current !== null) {
        insertIndexRef.current = null
        setInsertIndex(null)
      }
      return
    }

    const pointerX = operation.position.current.x
    if (pointerX == null) return

    const idx = computeInsertIndex(pointerX)
    if (idx !== insertIndexRef.current) {
      insertIndexRef.current = idx
      setInsertIndex(idx)
    }
  }

  function handleBlockClick(block: string) {
    if (solved) return
    setAnswer((prev) => [...prev, block])
  }

  function handleRemoveFromAnswer(block: string) {
    if (solved) return
    setAnswer((prev) => prev.filter((b) => b !== block))
  }

  function handleDragStart() {
    previousAnswer.current = answer
  }

  function handleDragEnd(operation: DragOperation, canceled: boolean) {
    if (solved) return

    if (canceled) {
      setAnswer(previousAnswer.current)
      setActiveId(null)
      return
    }

    const { source, target } = operation
    setActiveId(null)
    if (!source) return

    const sourceId = String(source.id)
    const isFromGlossary = sourceId.startsWith('avail-')

    if (isFromGlossary) {
      const block = sourceId.replace('avail-', '')
      if (target && (target.id === 'solution-area' || answer.includes(String(target.id)))) {
        if (!answer.includes(block)) {
          const idx = insertIndexRef.current ?? answer.length
          setAnswer((prev) => {
            const next = [...prev]
            next.splice(idx, 0, block)
            return next
          })
        }
      }
    }
    // Sortable reorder is handled by move() in onDragOver
  }

  const activeStr = activeId ? String(activeId) : null
  const isActiveFromGlossary = activeStr?.startsWith('avail-') ?? false
  const activeBlock = isActiveFromGlossary && activeStr
    ? activeStr.replace('avail-', '')
    : activeStr

  const dragProviderProps: Partial<DragDropEventHandlers> = {
    onDragStart(event) {
      if (solved) return
      const sourceId = String(event.operation.source?.id ?? '')
      const isFromGlossary = sourceId.startsWith('avail-')
      setActiveId(event.operation.source?.id ?? null)
      overSolutionRef.current = !isFromGlossary
      setOverSolution(!isFromGlossary)
      handleDragStart()
    },
    onDragOver(event) {
      const { source } = event.operation
      const sourceId = String(source?.id ?? '')

      // Sortable reorder: use move() to keep state in sync with visuals
      if (!sourceId.startsWith('avail-')) {
        setAnswer((prev) => move(prev, event))
        return
      }

      // Glossary hover tracking
      const targetId = event.operation.target?.id
      const isOver = targetId === 'solution-area' || answer.includes(String(targetId))
      if (isOver !== overSolutionRef.current) {
        overSolutionRef.current = isOver
        setOverSolution(isOver)
      }
      updateInsertIndex(event.operation)
    },
    onDragMove(event) {
      updateInsertIndex(event.operation)
    },
    onDragEnd(event) {
      overSolutionRef.current = false
      setOverSolution(false)
      handleDragEnd(event.operation, event.operation.canceled)
      insertIndexRef.current = null
      setInsertIndex(null)
    },
  }

  return {
    answer,
    solved,
    showHint,
    hintIndex,
    shakeSlots,
    activeId,
    activeBlock,
    isActiveFromGlossary,
    overSolution,
    insertIndex,
    handleBlockClick,
    handleRemoveFromAnswer,
    handleReset,
    setShowHint,
    dragProviderProps,
  }
}
