import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
  ],
}

describe('short options the log parser does not bundle', () => {
  it.each(['git log -pn1 --oneline', 'git diff -pU1', 'git show -ps'])('%s is refused', async (line) => {
    const sandbox = await createSandbox(SEED)

    const result = await sandbox.run(line)

    expect(result.outputs[0]?.prose).toBe(true)
    expect(result.outputs.some((output) => output.stream === 'stderr')).toBe(true)
  })
})
