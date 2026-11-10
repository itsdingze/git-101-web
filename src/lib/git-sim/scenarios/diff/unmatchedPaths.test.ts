import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'

async function dirty(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
    ],
  })
  await sandbox.writeFile('f.txt', `${BASE}x\n`)
  return sandbox
}

describe('paths after -- that match nothing', () => {
  it.each(['git diff -- nope.txt', 'git diff HEAD -- nope.txt', 'git diff --staged -- nope.txt', 'git diff HEAD HEAD -- nope.txt'])(
    '%s is silent',
    async (line) => {
      const sandbox = await dirty()

      expect((await sandbox.run(line)).outputs).toEqual([])
    },
  )

  it('still refuses an unknown word without --', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git diff nope.txt')).toContain("fatal: ambiguous argument 'nope.txt'")
  })
})
