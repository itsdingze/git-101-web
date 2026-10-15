import { isRecord } from './isRecord'

export type Story = Readonly<Record<string, readonly unknown[]>>

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

export function expandSeedStory(seed: unknown, story: Story): unknown {
  if (!isRecord(seed)) return seed

  const expanded = withExpandedLists(seed, ['setup'], story)
  if (isRecord(seed.remote)) expanded.remote = withExpandedLists(seed.remote, ['setup', 'ahead'], story)
  return expanded
}
