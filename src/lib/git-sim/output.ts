import type { CommandOutput } from './types'

export function stdout(text: string): CommandOutput {
  return { text, stream: 'stdout' }
}

export function stderr(text: string): CommandOutput {
  return { text, stream: 'stderr' }
}

export function say(text: string): CommandOutput[] {
  return [stdout(text)]
}

export function fail(text: string): CommandOutput[] {
  return [stderr(text)]
}

export const silent: CommandOutput[] = []
