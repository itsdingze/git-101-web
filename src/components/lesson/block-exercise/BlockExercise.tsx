import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import type { BlockExerciseStep } from '@/types'
import GlossaryBlock from './components/GlossaryBlock'
import OverlayBlock from './components/OverlayBlock'
import SolutionDropZone from './components/SolutionDropZone'
import SolutionBlocks from './components/SolutionBlocks'
import ExerciseControls from '@/components/lesson/ExerciseControls'
import useBlockDrag from './hooks/useBlockDrag'

interface BlockExerciseProps {
  step: BlockExerciseStep
  lessonId: number
}

export default function BlockExercise({ step, lessonId }: BlockExerciseProps) {
  const {
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
  } = useBlockDrag(step, lessonId)

  return (
    <div className="space-y-6">
      <p className="text-base font-medium text-text-primary leading-snug">{step.prompt}</p>

      <DragDropProvider {...dragProviderProps}>
        <SolutionDropZone solved={solved} shakeSlots={shakeSlots} overSolution={overSolution}>
          {answer.length === 0 && insertIndex === null ? (
            <span className="py-2 text-text-muted text-sm">Tap the blocks below, or drag them here, to build the command</span>
          ) : (
            <SolutionBlocks
              answer={answer}
              insertIndex={insertIndex}
              isActiveFromGlossary={isActiveFromGlossary}
              overSolution={overSolution}
              activeBlock={activeBlock}
              solved={solved}
              onRemove={handleRemoveFromAnswer}
            />
          )}
        </SolutionDropZone>

        <div className="flex flex-wrap justify-center gap-2">
          {step.availableBlocks.map((block) => (
            <GlossaryBlock
              key={block}
              block={block}
              isUsed={answer.includes(block) || !!(isActiveFromGlossary && activeBlock === block)}
              onAdd={() => handleBlockClick(block)}
              disabled={solved}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <OverlayBlock isPlaced={!isActiveFromGlossary}>
              {activeBlock}
            </OverlayBlock>
          ) : null}
        </DragOverlay>
      </DragDropProvider>

      <ExerciseControls
        hints={step.hints}
        hintIndex={hintIndex}
        showHint={showHint}
        solved={solved}
        onToggleHint={() => setShowHint((prev) => !prev)}
        onReset={handleReset}
      />
    </div>
  )
}
