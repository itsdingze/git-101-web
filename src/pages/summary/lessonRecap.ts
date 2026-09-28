import type { ReadingStep, Step } from '@/types'
import { splitShellComment } from '@/lib/text/shellComment'

function recapStep(steps: readonly Step[]): ReadingStep | undefined {
  return steps.find((step): step is ReadingStep => step.type === 'reading' && step.id === 'recap')
}

export function recapSkills(steps: readonly Step[]): string[] {
  const list = recapStep(steps)?.content.find((block) => block.type === 'list')
  return list?.type === 'list' ? [...list.items] : []
}

export function recapCommands(steps: readonly Step[]): string[] {
  const listed = (recapStep(steps)?.content ?? [])
    .flatMap((block) => (block.type === 'code' && block.language === 'bash' ? block.value.split('\n') : []))
    .map((line) => splitShellComment(line).code.trim())
    .filter(Boolean)

  const built = steps.flatMap((step) => (step.type === 'block-exercise' ? [step.correctAnswer.join(' ')] : []))

  return [...new Set([...listed, ...built])]
}
