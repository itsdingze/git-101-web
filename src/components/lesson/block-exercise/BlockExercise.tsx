import { useMemo } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import type { BlockExerciseStep } from '@/types'
import { GlossaryBlock } from './components/GlossaryBlock'
import { OverlayBlock } from './components/OverlayBlock'
import { SolutionDropZone } from './components/SolutionDropZone'
import { SolutionBlocks } from './components/SolutionBlocks'
import { ExerciseControls } from '@/components/lesson/components/ExerciseControls'
import { HintButton } from '@/components/lesson/components/HintButton'
import { HintPanel } from '@/components/lesson/components/HintPanel'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { FeedbackPanel } from '@/components/ui/FeedbackPanel'
import { messages } from '@/messages/en'
import { useBlockAnswer } from './hooks/useBlockAnswer'
import { useBlockDrag } from './hooks/useBlockDrag'
import { tileOrder } from './model/tileOrder'

interface BlockExerciseProps {
  step: BlockExerciseStep
  lessonId: number
}

export function BlockExercise({ step, lessonId }: BlockExerciseProps) {
  const blockAnswer = useBlockAnswer(step, lessonId)
  const { answer, solved, feedback, shaking, hintOpen, visibleHint, add, remove, toggleHint, reset } = blockAnswer
  const { zoneRef, activeId, activeBlock, isActiveFromGlossary, overSolution, insertIndex, dragProviderProps } =
    useBlockDrag(blockAnswer)
  const tiles = useMemo(() => tileOrder(step), [step])

  return (
    <div className="space-y-6">
      <InlineMarkdown
        as="h2"
        className="text-base font-medium text-text-primary leading-snug"
        value={step.prompt}
      />

      <DragDropProvider {...dragProviderProps}>
        <SolutionDropZone zoneRef={zoneRef} solved={solved} shakeSlots={shaking} overSolution={overSolution}>
          {answer.length === 0 && insertIndex === null ? (
            <span className="flex min-h-11 items-center text-text-muted text-sm">{messages.blocks.emptyAnswer}</span>
          ) : (
            <SolutionBlocks
              answer={answer}
              insertIndex={insertIndex}
              isActiveFromGlossary={isActiveFromGlossary}
              overSolution={overSolution}
              activeBlock={activeBlock}
              solved={solved}
              onRemove={remove}
            />
          )}
        </SolutionDropZone>

        <div className="flex flex-wrap justify-center gap-2">
          {tiles.map((block) => (
            <GlossaryBlock
              key={block}
              block={block}
              isUsed={answer.includes(block) || !!(isActiveFromGlossary && activeBlock === block)}
              onAdd={() => add(block)}
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

      <div role="status" aria-live="polite">
        {!solved && feedback && <FeedbackPanel tone="wrong" message={feedback} />}
        {solved && <FeedbackPanel tone="right" message={messages.blocks.correct(answer.join(' '))} />}
      </div>

      <ExerciseControls solved={solved} onReset={reset}>
        {step.hints && <HintButton open={hintOpen} onHint={toggleHint} />}
      </ExerciseControls>

      {visibleHint && <HintPanel hint={visibleHint} />}
    </div>
  )
}
