import { parse as parseYaml } from 'yaml'
import { isRecord } from './isRecord'
import { expandStorySteps, type Story } from './storySteps'

export function parseStory(source: string): Story {
  const checkpoints: unknown = parseYaml(source)
  if (!isRecord(checkpoints)) throw new Error('the story must be a list of named checkpoints')

  const story: Record<string, unknown[]> = {}
  for (const [name, steps] of Object.entries(checkpoints)) {
    if (!Array.isArray(steps)) throw new Error(`story checkpoint "${name}" must be a list of steps`)
    story[name] = steps
  }

  return Object.fromEntries(Object.entries(story).map(([name, steps]) => [name, expandStorySteps(steps, story, [name])]))
}
