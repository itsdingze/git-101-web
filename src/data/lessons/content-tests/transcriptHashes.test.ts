import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import type { ContentBlock, SandboxExerciseStep } from '@/types'
import { lessonById } from '@/data/lessons'
import { commandLocksFor } from '@/data/lessons/commandLocks'
import { saveInEditor } from './replaySandbox'
import { COURSE_IDENTITY, SOLUTIONS } from './solutions'

const HASH_LINES = [/^\[\S+ [0-9a-f]{7}\] .*$/gm, /^ {3}[0-9a-f]{7}\.\.[0-9a-f]{7} .*$/gm]
const CONTINUOUS_LESSONS = [7, 8, 9, 10]
const LOG_LINE = /^([0-9a-f]{7}) (?:\([^)]*\) )?(.+)$/
const COMMIT_LINE = /^\[\S+ ([0-9a-f]{7})\] (.+)$/

async function replayTranscript(lessonId: number, stepId: string): Promise<string> {
  const step = lessonById(lessonId)?.steps.find(
    (candidate): candidate is SandboxExerciseStep => candidate.type === 'sandbox-exercise' && candidate.id === stepId,
  )
  if (!step) throw new Error(`no sandbox step ${stepId} in lesson ${lessonId}`)

  const sandbox = await createSandbox({ ...step.seed, identity: COURSE_IDENTITY }, commandLocksFor(lessonId), 'navigation-only')
  const outputs: string[] = []
  for (const line of SOLUTIONS[stepId] ?? []) {
    if (typeof line !== 'string') await saveInEditor(sandbox, line)
    else outputs.push(...(await sandbox.run(line)).outputs.map((output) => output.text))
  }
  return outputs.join('\n')
}

function terminalText(blocks: readonly ContentBlock[]): string[] {
  return blocks.flatMap((block) => (block.type === 'terminal' ? block.lines.flatMap((line) => (line.kind === 'output' ? [line.text] : [])) : []))
}

function hashesBySubject(lessonIds: readonly number[]): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>()
  const outputs = lessonIds.flatMap((lessonId) =>
    (lessonById(lessonId)?.steps ?? []).flatMap((step) => (step.type === 'reading' ? terminalText(step.content) : [])),
  )
  for (const text of outputs) {
    const [, hash, subject] = COMMIT_LINE.exec(text) ?? LOG_LINE.exec(text) ?? []
    if (!hash || !subject) continue
    found.set(subject.trim(), (found.get(subject.trim()) ?? new Set()).add(hash))
  }
  return found
}

describe('commit hashes printed in lesson transcripts', () => {
  it('match what finishing the conflict merge in lesson 10 prints', async () => {
    const transcript = await replayTranscript(10, 'resolve-a-conflict')
    const lessonText = JSON.stringify(lessonById(10))
    const printed = HASH_LINES.flatMap((pattern) => transcript.match(pattern) ?? [])

    expect(printed.length).toBeGreaterThan(0)
    for (const line of printed) expect(lessonText).toContain(line)
  })

  it('name each commit by one hash across lessons 7 to 10', () => {
    const found = hashesBySubject(CONTINUOUS_LESSONS)

    expect(found.get('feat: sort tasks by due date')).toEqual(new Set(['71779aa']))
    expect(found.size).toBeGreaterThan(5)
    for (const [subject, hashes] of found) expect([subject, [...hashes]]).toEqual([subject, [[...hashes][0]]])
  })
})
