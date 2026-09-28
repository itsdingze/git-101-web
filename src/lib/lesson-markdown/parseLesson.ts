import { parse as parseYaml } from 'yaml'
import type { z } from 'zod'
import type { Lesson, ReadingStep, Step } from '@/types'
import LineReader from './LineReader'
import { FENCE, parseContentBlock, readFence } from './contentBlocks'
import {
  describeIssues,
  exerciseSchemas,
  frontmatterSchema,
  scenarioSchema,
  visualizationSchema,
  type ExerciseType,
} from './lessonSchema'

const HEADING = /^## (.+?) \{(.+)\}$/

export default function parseLesson(source: string, fileName: string): Lesson {
  const reader = new LineReader(source.split(/\r?\n/), fileName)
  const meta = readFrontmatter(reader)
  const steps: Step[] = []
  let reading: ReadingStep | null = null

  for (reader.skipBlankLines(); !reader.done; reader.skipBlankLines()) {
    const line = reader.peek()
    if (line.startsWith('## ')) {
      reading = readHeading(reader)
      steps.push(reading)
    } else if (line.startsWith(FENCE) && isExerciseType(line.slice(FENCE.length))) {
      steps.push(readExercise(reader, line.slice(FENCE.length) as ExerciseType))
      reading = null
    } else if (reading) {
      reading.content.push(parseContentBlock(reader))
    } else {
      throw reader.error('content must sit under a "## Title {#id}" heading')
    }
  }

  return { ...meta, steps }
}

function isExerciseType(value: string): value is ExerciseType {
  return value in exerciseSchemas
}

function readExercise(reader: LineReader, type: ExerciseType): Step {
  const start = reader.lineNumber
  const fields: unknown = parseYaml(readFence(reader))
  const result = exerciseSchemas[type].safeParse({ ...(fields as object), type })
  if (!result.success) {
    const id = (fields as { id?: unknown } | null)?.id
    throw reader.error(`${type} "${typeof id === 'string' ? id : '?'}": ${describeIssues(result.error)}`, start)
  }
  return result.data
}

function readHeading(reader: LineReader): ReadingStep {
  const [, title, attributes = ''] = HEADING.exec(reader.peek()) ?? []
  if (!title) throw reader.error('a step heading looks like "## Title {#step-id}"')

  const step: ReadingStep = { type: 'reading', id: '', title, content: [] }
  for (const attribute of attributes.split(' ')) {
    const [key = '', value = ''] = attribute.split('=')
    if (key.startsWith('#')) step.id = key.slice(1)
    else if (key === 'visualization') step.visualization = checked(reader, visualizationSchema, value)
    else if (key === 'variant') step.visualizationVariant = checked(reader, scenarioSchema, value)
    else throw reader.error(`unknown heading attribute "${attribute}", use #id, visualization= or variant=`)
  }
  if (!step.id) throw reader.error('give the step an id, like "{#staging-files}"')

  reader.next()
  return step
}

function checked<T>(reader: LineReader, schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw reader.error(describeIssues(result.error))
  return result.data
}

function readFrontmatter(reader: LineReader): Omit<Lesson, 'steps'> {
  if (reader.next() !== '---') throw reader.error('a lesson starts with a --- frontmatter block', 1)
  const lines: string[] = []
  while (reader.peek() !== '---') {
    if (reader.done) throw reader.error('the frontmatter block is never closed with ---', 1)
    lines.push(reader.next())
  }
  reader.next()
  return checked(reader, frontmatterSchema, parseYaml(lines.join('\n')))
}
