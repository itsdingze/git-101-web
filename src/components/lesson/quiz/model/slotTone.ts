export type SlotTone = 'idle' | 'selected' | 'wrong' | 'correct'

interface QuizState {
  selected: number | null
  correctSlot: number
  completed: boolean
  wrong: boolean
}

export function slotTone(slot: number, { selected, correctSlot, completed, wrong }: QuizState): SlotTone {
  if (completed) return slot === correctSlot ? 'correct' : 'idle'
  if (slot !== selected) return 'idle'
  return wrong ? 'wrong' : 'selected'
}
