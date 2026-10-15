import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import type { SandboxExerciseStep } from '@/types'
import { lessonById } from '@/data/lessons'
import { commandLocksFor } from '@/data/lessons/commandLocks'
import { saveInEditor } from './replaySandbox'
import { SOLUTIONS } from './solutions'

const HASH_LINES = [/^\[\S+ [0-9a-f]{7}\] .*$/gm, /^ {3}[0-9a-f]{7}\.\.[0-9a-f]{7} .*$/gm]

async function replayTranscript(lessonId: number, stepId: string): Promise<string> {
  const step = lessonById(lessonId)?.steps.find(
    (candidate): candidate is SandboxExerciseStep => candidate.type === 'sandbox-exercise' && candidate.id === stepId,
  )
  if (!step) throw new Error(`no sandbox step ${stepId} in lesson ${lessonId}`)

  const sandbox = await createSandbox(step.seed, commandLocksFor(lessonId), 'navigation-only')
  const outputs: string[] = []
  for (const line of SOLUTIONS[stepId] ?? []) {
    if (typeof line !== 'string') await saveInEditor(sandbox, line)
    else outputs.push(...(await sandbox.run(line)).outputs.map((output) => output.text))
  }
  return outputs.join('\n')
}

describe('commit hashes printed in lesson transcripts', () => {
  it('match what finishing the conflict merge in lesson 10 prints', async () => {
    const transcript = await replayTranscript(10, 'resolve-a-conflict')
    const lessonText = JSON.stringify(lessonById(10))
    const printed = HASH_LINES.flatMap((pattern) => transcript.match(pattern) ?? [])

    expect(printed.length).toBeGreaterThan(0)
    for (const line of printed) expect(lessonText).toContain(line)
  })
})
