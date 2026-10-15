import { parse as parseYaml } from 'yaml'
import type { Lesson, ReadingStep, Step } from '@/types'
import { LineReader } from './LineReader'
import { expandSeedStory, type Story } from './storySteps'
import { FENCE, parseContentBlock } from './contentBlocks'
import { exerciseSchemas, frontmatterSchema, validate, type ExerciseType } from './lessonSchema'
import { isVisualizationFence, readVisualizationBlock } from './visualizationBlock'
import { readYamlFence } from './yamlFence'
import { isOwnKey } from '../isOwnKey'

const HEADING = /^## (.+?) \{(.+)\}$/

export function parseLesson(source: string, fileName: string, story: Story = {}): Lesson {
  const reader = new LineReader(source.split(/\r?\n/), fileName)
  const meta = readFrontmatter(reader)
  const steps: Step[] = []
  let reading: ReadingStep | null = null

  for (reader.skipBlankLines(); !reader.done; reader.skipBlankLines()) {
    const line = reader.peek()
    const start = reader.lineNumber
    const exerciseType = exerciseTypeOf(line)
    if (line.startsWith('## ')) {
      reading = readHeading(reader)
      appendStep(reader, steps, reading, start)
    } else if (exerciseType) {
      appendStep(reader, steps, readExercise(reader, exerciseType, story), start)
      reading = null
    } else if (reading?.visualization) {
      throw reader.error('the diagram shows at the end of its step, so put the visualization block last')
    } else if (reading && isVisualizationFence(line)) {
      reading.visualization = readVisualizationBlock(reader)
    } else if (reading) {
      reading.content.push(parseContentBlock(reader))
    } else {
      throw reader.error('content must sit under a "## Title {#id}" heading')
    }
  }

  return { ...meta, steps }
}

function appendStep(reader: LineReader, steps: Step[], step: Step, line: number): void {
  if (steps.some((existing) => existing.id === step.id)) {
    throw reader.error(`step id "${step.id}" is already used in this lesson`, line)
  }
  steps.push(step)
}

function exerciseTypeOf(line: string): ExerciseType | null {
  const name = line.startsWith(FENCE) ? line.slice(FENCE.length) : ''
  return isOwnKey(exerciseSchemas, name) ? name : null
}

function withStorySeed(fields: Record<string, unknown>, story: Story): Record<string, unknown> {
  return 'seed' in fields ? { ...fields, seed: expandSeedStory(fields.seed, story) } : fields
}

function readExercise(reader: LineReader, type: ExerciseType, story: Story): Step {
  const start = reader.lineNumber
  const fields = readYamlFence(reader)
  const id = typeof fields.id === 'string' ? fields.id : '?'

  return reader.failingAt(
    start,
    () => validate<Step>(exerciseSchemas[type], { ...withStorySeed(fields, story), type }),
    `${type} "${id}"`,
  )
}

function readHeading(reader: LineReader): ReadingStep {
  const [, title, attributes = ''] = HEADING.exec(reader.peek()) ?? []
  if (!title) throw reader.error('a step heading looks like "## Title {#step-id}"')

  const step: ReadingStep = { type: 'reading', id: '', title, content: [] }
  for (const attribute of attributes.split(' ')) {
    if (!attribute.startsWith('#')) {
      throw reader.error(`unknown heading attribute "${attribute}", use #id and put a diagram in a visualization block`)
    }
    if (step.id) throw reader.error('give the step one id, like "{#staging-files}"')
    step.id = attribute.slice(1)
  }
  if (!step.id) throw reader.error('give the step an id, like "{#staging-files}"')

  reader.next()
  return step
}

function readFrontmatter(reader: LineReader): Omit<Lesson, 'steps'> {
  if (reader.next() !== '---') throw reader.error('a lesson starts with a --- frontmatter block', 1)
  const lines: string[] = []
  while (reader.peek() !== '---') {
    if (reader.done) throw reader.error('the frontmatter block is never closed with ---', 1)
    lines.push(reader.next())
  }
  reader.next()
  return reader.failingAt(reader.lineNumber, () => validate(frontmatterSchema, parseYaml(lines.join('\n'))))
}
