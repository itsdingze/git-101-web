import type { Lesson, Step } from '@/types'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'

export type Story = Readonly<Record<string, readonly unknown[]>>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function checkpointNamedBy(step: unknown): string | null {
  return isRecord(step) && typeof step.story === 'string' ? step.story : null
}

export function expandStorySteps(steps: readonly unknown[], story: Story, trail: readonly string[] = []): unknown[] {
  return steps.flatMap((step) => {
    const name = checkpointNamedBy(step)
    if (name === null) return [step]
    if (trail.includes(name)) throw new Error(`story checkpoint "${name}" includes itself`)

    const checkpoint = story[name]
    if (!checkpoint) {
      throw new Error(`no story checkpoint "${name}". Checkpoints: ${Object.keys(story).join(', ')}`)
    }
    return expandStorySteps(checkpoint, story, [...trail, name])
  })
}

function withExpandedLists(holder: Record<string, unknown>, keys: readonly string[], story: Story): Record<string, unknown> {
  const expanded = { ...holder }
  for (const key of keys) {
    const steps = holder[key]
    if (Array.isArray(steps)) expanded[key] = expandStorySteps(steps, story)
  }
  return expanded
}

function expandSeed(seed: unknown, story: Story): unknown {
  if (!isRecord(seed)) return seed

  const expanded = withExpandedLists(seed, ['setup'], story)
  if (isRecord(seed.remote)) expanded.remote = withExpandedLists(seed.remote, ['setup', 'ahead'], story)
  return expanded
}

function withStorySeed(step: Step, story: Story): Step {
  if (step.type !== 'sandbox-exercise') return step

  try {
    return { ...step, seed: expandSeed(step.seed, story) as SandboxSeed }
  } catch (error) {
    throw new Error(`sandbox-exercise "${step.id}": ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function withStorySeeds(lesson: Lesson, story: Story): Lesson {
  return { ...lesson, steps: lesson.steps.map((step) => withStorySeed(step, story)) }
}
