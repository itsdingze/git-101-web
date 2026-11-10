import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
  ],
}

describe('--help and -h', () => {
  it.each([
    ['git log --help', 'log'],
    ['git log -h', 'log'],
    ['git commit -h', 'commit'],
    ['git push --help', 'push'],
  ])('%s says manual pages are not shown', async (line, name) => {
    const sandbox = await createSandbox(SEED)

    expect((await sandbox.run(line)).outputs).toEqual([
      { stream: 'stderr', prose: true, text: `This practice terminal doesn't show manual pages for git ${name}. Run git help to see the commands it simulates.` },
    ])
  })

  it('still reads -h as a message value', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('f.txt', 'changed\n')

    await sandbox.run('git commit -am -h')

    expect(await textOf(sandbox, 'git log -1 --format=%s')).toBe('-h')
  })
})
