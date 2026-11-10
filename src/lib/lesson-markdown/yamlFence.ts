import { parse as parseYaml, YAMLParseError } from 'yaml'
import type { LineReader } from './LineReader'
import { readFence } from './contentBlocks'
import { isRecord } from './isRecord'

export function parseYamlFrom(reader: LineReader, text: string, firstLine: number): unknown {
  try {
    return parseYaml(text)
  } catch (error) {
    if (!(error instanceof YAMLParseError)) throw error
    const line = firstLine + (error.linePos?.[0].line ?? 1) - 1
    throw reader.error(error.message.split(' at line ')[0] ?? error.message, line)
  }
}

export function readYamlFence(reader: LineReader): Record<string, unknown> {
  const firstLine = reader.lineNumber + 1
  const parsed = parseYamlFrom(reader, readFence(reader), firstLine)
  return isRecord(parsed) ? parsed : {}
}
