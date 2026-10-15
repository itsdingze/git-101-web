import { parse as parseYaml } from 'yaml'
import type { LineReader } from './LineReader'
import { readFence } from './contentBlocks'
import { isRecord } from './isRecord'

export function readYamlFence(reader: LineReader): Record<string, unknown> {
  const parsed: unknown = parseYaml(readFence(reader))
  return isRecord(parsed) ? parsed : {}
}
