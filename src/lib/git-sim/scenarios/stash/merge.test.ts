import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'cookbook',
  setup: [
    { run: 'git init' },
    { write: { 'd.md': 'l1\nl2\nl3\nl4\nl5\n', 'n.md': 'n\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

const UNSTAGED_STATUS = [
  'On branch main',
  'Changes not staged for commit:',
  '  (use "git add <file>..." to update what will be committed)',
  '  (use "git restore <file>..." to discard changes in working directory)',
  '\tmodified:   d.md',
  '',
  'no changes added to commit (use "git add" and/or "git commit -a")',
]

const CONFLICT_REPORT = [
  'Auto-merging d.md',
  'CONFLICT (content): Merge conflict in d.md',
  'On branch main',
  'Unmerged paths:',
  '  (use "git restore --staged <file>..." to unstage)',
  '  (use "git add <file>..." to mark resolution)',
  '\tboth modified:   d.md',
  '',
  'no changes added to commit (use "git add" and/or "git commit -a")',
]

const KEPT = 'The stash entry is kept in case you need it again.'

async function shelvedThenCommitted(committed: string): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('echo "l1\nl2\nl3\nl4\nSTASHED" > d.md')
  await sandbox.run('git stash')
  await sandbox.run(`echo "${committed}" > d.md`)
  await sandbox.run('git commit -am "Change the chapter"')
  return sandbox
}

describe('popping a stash onto a file that changed since', () => {
  it('merges changes to different lines and keeps both', async () => {
    const sandbox = await shelvedThenCommitted('COMMITTED\nl2\nl3\nl4\nl5')

    const popped = (await textOf(sandbox, 'git stash pop')).split('\n')
    expect(popped.slice(0, -1)).toEqual(['Auto-merging d.md', ...UNSTAGED_STATUS])
    expect(popped[popped.length - 1]).toMatch(/^Dropped refs\/stash@\{0\} \([0-9a-f]{40}\)$/)
    expect(await textOf(sandbox, 'cat d.md')).toBe('COMMITTED\nl2\nl3\nl4\nSTASHED')
    expect(await textOf(sandbox, 'git stash list')).toBe('')
  })

  it('stops on clashing lines with markers and keeps the entry', async () => {
    const sandbox = await shelvedThenCommitted('l1\nl2\nl3\nl4\nCOMMITTED')

    expect(await textOf(sandbox, 'git stash pop')).toBe([...CONFLICT_REPORT, KEPT].join('\n'))
    expect(await textOf(sandbox, 'cat d.md')).toBe(
      ['l1', 'l2', 'l3', 'l4', '<<<<<<< Updated upstream', 'COMMITTED', '=======', 'STASHED', '>>>>>>> Stashed changes'].join('\n'),
    )
    expect(await textOf(sandbox, 'git stash list')).toMatch(/^stash@\{0\}: WIP on main/)
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
  })

  it('lets the learner settle the clash with git add and commit', async () => {
    const sandbox = await shelvedThenCommitted('l1\nl2\nl3\nl4\nCOMMITTED')
    await sandbox.run('git stash pop')
    await sandbox.run('echo "l1\nl2\nl3\nl4\nBOTH" > d.md')
    await sandbox.run('git add .')

    expect(await textOf(sandbox, 'git status --short')).toBe('M  d.md')
    expect(await textOf(sandbox, 'git commit -m "Settle it"')).toMatch(/^\[main [0-9a-f]{7}\] Settle it/)
  })

  it('lets git add . settle a clash resolved back to the committed version', async () => {
    const sandbox = await shelvedThenCommitted('l1\nl2\nl3\nl4\nCOMMITTED')
    await sandbox.run('git stash pop')
    await sandbox.run('echo "l1\nl2\nl3\nl4\nCOMMITTED" > d.md')
    await sandbox.run('git add .')

    expect(await textOf(sandbox, 'git status --short')).toBe('')
  })

  it('reports the same clash for apply, without the kept line', async () => {
    const sandbox = await shelvedThenCommitted('l1\nl2\nl3\nl4\nCOMMITTED')

    expect(await textOf(sandbox, 'git stash apply')).toBe(CONFLICT_REPORT.join('\n'))
  })
})

describe('popping a stash over uncommitted edits', () => {
  it('refuses when an edit would be overwritten, shows the status, and keeps the entry', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "stashed" > d.md')
    await sandbox.run('git stash')
    await sandbox.run('echo "local" > d.md')

    expect(await textOf(sandbox, 'git stash pop')).toBe(
      [
        'error: Your local changes to the following files would be overwritten by merge:',
        '\td.md',
        'Please commit your changes or stash them before you merge.',
        'Aborting',
        ...UNSTAGED_STATUS,
        KEPT,
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'cat d.md')).toBe('local')
    expect(await textOf(sandbox, 'git stash list')).toMatch(/^stash@\{0\}/)
  })

  it('refuses apply the same way, without the kept line', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "stashed" > d.md')
    await sandbox.run('git stash')
    await sandbox.run('echo "local" > d.md')

    expect(await textOf(sandbox, 'git stash apply')).toBe(
      [
        'error: Your local changes to the following files would be overwritten by merge:',
        '\td.md',
        'Please commit your changes or stash them before you merge.',
        'Aborting',
        ...UNSTAGED_STATUS,
      ].join('\n'),
    )
  })

  it('brings the stash back alongside an unrelated edit', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "stashed" > d.md')
    await sandbox.run('git stash')
    await sandbox.run('echo "other" > n.md')

    await sandbox.run('git stash pop')
    expect(await textOf(sandbox, 'cat d.md')).toBe('stashed')
    expect(await textOf(sandbox, 'cat n.md')).toBe('other')
  })
})
