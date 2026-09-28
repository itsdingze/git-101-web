import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import lessons from '@/data/lessons'

function withinSeconds<T>(work: Promise<T>, seconds: number): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`no answer within ${seconds}s`)), seconds * 1000)
    }),
  ])
}

async function ignoreLessonSandbox(): Promise<Sandbox> {
  const step = lessons
    .flatMap((lesson) => lesson.steps)
    .find((candidate) => candidate.type === 'sandbox-exercise' && candidate.id === 'ignore-rules-in-practice')
  if (step?.type !== 'sandbox-exercise') throw new Error('lesson 4 practice not found')
  return createSandbox(step.seed)
}

describe('a folder named with a backslash', () => {
  it('does not hang the snapshot after a broken repository is replaced one level up', async () => {
    const sandbox = await ignoreLessonSandbox()
    for (const line of ['mkdir \\', 'echo junk > .git/HEAD', 'cd ..', 'git init']) await sandbox.run(line)

    const snapshot = await withinSeconds(sandbox.snapshot(), 3)

    expect(snapshot.workdirFiles).not.toContain('\\')
  })
})
