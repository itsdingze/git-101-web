import { parse as parseYaml } from 'yaml'
import { expandStorySteps, type Story } from './storySteps'

export default function parseStory(source: string): Story {
  const checkpoints: unknown = parseYaml(source)
  if (typeof checkpoints !== 'object' || checkpoints === null || Array.isArray(checkpoints)) {
    throw new Error('the story must be a list of named checkpoints')
  }

  for (const [name, steps] of Object.entries(checkpoints)) {
    if (!Array.isArray(steps)) throw new Error(`story checkpoint "${name}" must be a list of steps`)
  }

  const story = checkpoints as Story
  return Object.fromEntries(
    Object.keys(story).map((name) => [name, expandStorySteps(story[name] ?? [], story, [name])]),
  )
}
