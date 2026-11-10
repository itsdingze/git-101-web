import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

describe('a note after # on the command line', () => {
  it.each([
    ['git log -3  # only the newest three', 'Initial commit'],
    ['git status # note', 'On branch main'],
    ['git branch # list', '* main'],
  ])('is ignored by %s', async (line, printed) => {
    const sandbox = await createSandbox(SEED)

    const result = await sandbox.run(line)

    expect(result.outputs.some((output) => output.stream === 'stderr')).toBe(false)
    expect(result.outputs.map((output) => output.text).join('\n')).toContain(printed)
  })

  it('leaves the command before it to run in full', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('g.txt', 'two\n')

    await sandbox.run('git add . # stage everything')
    await sandbox.run('git commit -m "second" # records it')

    expect(await textOf(sandbox, 'git log --oneline -1')).toContain('second')
  })

  it('can hold an apostrophe without opening a quote', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, "git status --short # don't worry")).toBe('')
  })

  it('can hold a dollar sign without being refused', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git status --short # costs $5')).toBe('')
  })

  it('runs nothing when the whole line is a note', async () => {
    const sandbox = await createSandbox(SEED)

    expect((await sandbox.run('# just a note')).outputs).toEqual([])
  })
})

describe('a # that is not a note', () => {
  it('stays literal inside double quotes', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo "# heading"')).toBe('# heading')
  })

  it('stays literal inside single quotes', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, "echo '# heading'")).toBe('# heading')
  })

  it('stays literal inside a word', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo issue#42')).toBe('issue#42')
  })

  it('stays literal when escaped', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo \\#42')).toBe('#42')
  })

  it('stays literal right after an empty quoted word', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo ""#42')).toBe('#42')
  })
})
