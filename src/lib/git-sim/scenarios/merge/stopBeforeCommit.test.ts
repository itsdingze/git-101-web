import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m base' },
    { run: 'git switch -q -c work' },
    { write: { 'w.txt': 'a\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m work' },
    { run: 'git switch -q main' },
  ],
}

async function diverged(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('m.txt', 'b\n')
  await sandbox.run('git add .')
  await sandbox.run('git commit -q -m main-work')
  return sandbox
}

async function conflicting(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -q work')
  await sandbox.writeFile('f.txt', 'one\ntheirs\n')
  await sandbox.run('git commit -qam theirs')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', 'one\nours\n')
  await sandbox.run('git commit -qam ours')
  return sandbox
}

function subjects(log: string): string[] {
  return log.split('\n').map((line) => line.replace(/^[0-9a-f]{7} (\([^)]*\) )?/, ''))
}

describe('git merge --squash', () => {
  it('stages a fast-forward without moving the branch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git merge --squash work')).toMatch(
      /^Updating [0-9a-f]{7}\.\.[0-9a-f]{7}\nFast-forward\nSquash commit -- not updating HEAD\n w\.txt \| 1 \+\n 1 file changed, 1 insertion\(\+\)\n create mode 100644 w\.txt$/,
    )
    expect(await textOf(sandbox, 'git status --short')).toBe('A  w.txt')
    expect(subjects(await textOf(sandbox, 'git log --oneline'))).toEqual(['base'])
  })

  it('stages a true merge without recording it', async () => {
    const sandbox = await diverged()

    expect(await textOf(sandbox, 'git merge --squash work')).toBe(
      'Squash commit -- not updating HEAD\nAutomatic merge went well; stopped before committing as requested',
    )
    expect(await textOf(sandbox, 'git status --short')).toBe('A  w.txt')
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
  })

  it('leaves a single-parent commit behind', async () => {
    const sandbox = await diverged()
    await sandbox.run('git merge --squash work')

    await sandbox.run('git commit -m squashed')

    expect(subjects(await textOf(sandbox, 'git log --oneline'))).toEqual(['squashed', 'main-work', 'base'])
  })

  it('stops at a conflict without a merge in progress', async () => {
    const sandbox = await conflicting()

    expect(await textOf(sandbox, 'git merge --squash work')).toBe(
      [
        'Auto-merging f.txt',
        'CONFLICT (content): Merge conflict in f.txt',
        'Squash commit -- not updating HEAD',
        'Automatic merge failed; fix conflicts and then commit the result.',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'git status --short')).toBe('UU f.txt\nA  w.txt')
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
  })

  it('cannot be combined with --no-ff', async () => {
    const sandbox = await diverged()

    expect(await textOf(sandbox, 'git merge --squash --no-ff work')).toBe('fatal: You cannot combine --squash with --no-ff.')
  })

  it('cannot be combined with --commit', async () => {
    const sandbox = await diverged()

    expect(await textOf(sandbox, 'git merge --squash --commit work')).toBe('fatal: You cannot combine --squash with --commit.')
  })
})

describe('git merge --no-commit', () => {
  it('still fast-forwards', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git merge --no-commit work')).toContain('Fast-forward')
    expect(subjects(await textOf(sandbox, 'git log --oneline'))).toEqual(['work', 'base'])
  })

  it('stops before recording a true merge', async () => {
    const sandbox = await diverged()

    expect(await textOf(sandbox, 'git merge --no-commit work')).toBe(
      'Automatic merge went well; stopped before committing as requested',
    )
    expect(await textOf(sandbox, 'git status')).toContain('All conflicts fixed but you are still merging.')
    expect(await textOf(sandbox, 'git status --short')).toBe('A  w.txt')
    expect(subjects(await textOf(sandbox, 'git log --oneline'))).toEqual(['main-work', 'base'])
  })

  it('records the merge on the next commit', async () => {
    const sandbox = await diverged()
    await sandbox.run('git merge --no-commit work')

    expect(await textOf(sandbox, 'git commit --no-edit')).toMatch(/^\[main [0-9a-f]{7}\] Merge branch 'work'$/)

    expect(subjects(await textOf(sandbox, 'git log --oneline'))).toEqual(["Merge branch 'work'", 'main-work', 'work', 'base'])
  })

  it('makes no fast-forward with --no-ff', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git merge --no-commit --no-ff work')).toBe(
      'Automatic merge went well; stopped before committing as requested',
    )
    expect(subjects(await textOf(sandbox, 'git log --oneline'))).toEqual(['base'])
  })
})

describe('merging more than one branch at once', () => {
  it('is refused with a course message', async () => {
    const sandbox = await createSandbox(SEED)

    expect((await sandbox.run('git merge work main')).outputs).toEqual([
      { stream: 'stderr', prose: true, text: 'This practice terminal merges one branch at a time. Run git merge once for each branch.' },
    ])
  })
})
