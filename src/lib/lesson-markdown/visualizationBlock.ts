import type { Visualization, VisualizationType } from '@/types'
import type { LineReader } from './LineReader'
import { validate, visualizationSchemas } from './lessonSchema'
import { readYamlFence } from './yamlFence'
import { isOwnKey } from '../isOwnKey'

const VISUALIZATION = /^```visualization(?: (.*))?$/

export function isVisualizationFence(line: string): boolean {
  return VISUALIZATION.test(line)
}

export function readVisualizationBlock(reader: LineReader): Visualization {
  const start = reader.lineNumber
  const [, kind = ''] = VISUALIZATION.exec(reader.peek()) ?? []
  if (!kind) throw reader.error('name the diagram after visualization, like "```visualization git-graph"')
  if (!isVisualizationType(kind)) {
    throw reader.error(`unknown visualization "${kind}", use one of ${Object.keys(visualizationSchemas).join(', ')}`)
  }

  const fields = readYamlFence(reader)
  return reader.failingAt(
    start,
    () => validate<Visualization>(visualizationSchemas[kind], { ...fields, kind }),
    `visualization ${kind}`,
  )
}

function isVisualizationType(value: string): value is VisualizationType {
  return isOwnKey(visualizationSchemas, value)
}
