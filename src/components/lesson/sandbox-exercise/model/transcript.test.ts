import { describe, expect, it } from 'vitest'
import { EMPTY_TRANSCRIPT, appendToTranscript, printedEntries, settleCommand } from './transcript'

const PROMPT = { directory: '~/todo-app', branch: 'main' }

function texts(transcript: { lines: readonly { text: string }[] }): string[] {
  return transcript.lines.map((line) => line.text)
}

describe('transcript', () => {
  it('gives every appended line its own id', () => {
    const transcript = appendToTranscript(appendToTranscript(EMPTY_TRANSCRIPT, [{ kind: 'stdout', text: 'a' }]), [
      { kind: 'stdout', text: 'b' },
    ])

    expect(new Set(transcript.lines.map((line) => line.id)).size).toBe(2)
  })

  it('prints what a command wrote, skipping empty output', () => {
    const entries = printedEntries({
      clearScreen: false,
      outputs: [
        { stream: 'stdout', text: 'On branch main' },
        { stream: 'stdout', text: '' },
        { stream: 'stderr', text: 'fatal: not a git repository' },
      ],
    })

    expect(entries).toEqual([
      { kind: 'stdout', text: 'On branch main' },
      { kind: 'stderr', text: 'fatal: not a git repository' },
    ])
  })

  it('prints nothing for a command that clears the screen', () => {
    expect(printedEntries({ clearScreen: true, outputs: [{ stream: 'stdout', text: 'ignored' }] })).toEqual([])
  })

  it('adds the coach lines after a normal command', () => {
    const before = appendToTranscript(EMPTY_TRANSCRIPT, [{ kind: 'command', text: 'git status', prompt: PROMPT }])

    const after = settleCommand(before, false, {
      opening: [{ kind: 'goal', text: 'Make a commit' }],
      coach: [{ kind: 'tip', text: 'Stage it first.' }],
    })

    expect(texts(after)).toEqual(['git status', 'Stage it first.'])
  })

  it('restarts with the opening coach when the command clears the screen', () => {
    const before = appendToTranscript(EMPTY_TRANSCRIPT, [
      { kind: 'command', text: 'git status', prompt: PROMPT },
      { kind: 'stdout', text: 'On branch main' },
      { kind: 'command', text: 'clear', prompt: PROMPT },
    ])

    const after = settleCommand(before, true, {
      opening: [{ kind: 'goal', text: 'Make a commit' }],
      coach: [{ kind: 'tip', text: 'Stage it first.' }],
    })

    expect(texts(after)).toEqual(['Make a commit'])
    expect(before.lines.map((line) => line.id)).not.toContain(after.lines[0]?.id)
  })
})
