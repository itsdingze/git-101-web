import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'

const BROKEN_FEATURE = ['export function broken() {', '  throw new Error("boom")', '}', ''].join('\n')

const GIT_DATE_LINE = /^ Date: \w{3} \w{3} \d{1,2} \d{2}:\d{2}:\d{2} \d{4} \+0000$/

const REVERT_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n', 'style.css': 'body { margin: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'style.css': 'body { margin: 0; padding: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Reset the page padding"' },
    { write: { 'broken-feature.js': BROKEN_FEATURE } },
    { run: 'git add .' },
    { run: 'git commit -m "Add broken feature"' },
  ],
}

const STACKED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'index.html': '<h1>Second</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Second"' },
    { write: { 'index.html': '<h1>Third</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Third"' },
  ],
}

const REMOVED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'notes.txt': 'First pass\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add notes"' },
    { run: 'git rm notes.txt' },
    { run: 'git commit -m "Remove notes"' },
  ],
}

const REWRITTEN_THEN_REMOVED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'notes.txt': 'First pass\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add notes"' },
    { write: { 'notes.txt': 'Second pass\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Update notes"' },
    { run: 'git rm notes.txt' },
    { run: 'git commit -m "Remove notes"' },
  ],
}

const MERGE_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c add-navbar' },
    { write: { 'navbar.html': '<nav></nav>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add navbar"' },
    { run: 'git switch main' },
    { write: { 'style.css': 'body { margin: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add a stylesheet"' },
    { run: 'git merge add-navbar' },
  ],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('reverting the last commit', () => {
  it('deletes the file the commit added and records the opposite commit', async () => {
    const sandbox = await createSandbox(REVERT_SEED)

    const reverted = await textOf(sandbox, 'git revert HEAD')
    expect(reverted.split('\n')).toEqual([
      expect.stringMatching(/^\[main [0-9a-f]{7}\] Revert "Add broken feature"$/),
      expect.stringMatching(GIT_DATE_LINE),
      ' 1 file changed, 3 deletions(-)',
      ' delete mode 100644 broken-feature.js',
    ])

    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })

  it('leaves the reverted commit in history and adds the revert on top', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    await sandbox.run('git revert HEAD')

    const history = (await textOf(sandbox, 'git log --oneline')).split('\n')
    expect(history[0]).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) Revert "Add broken feature"$/)
    expect(history[1]).toMatch(/^[0-9a-f]{7} Add broken feature$/)
    expect(history).toHaveLength(4)
  })

  it('records the commit it undoes in the message body', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    const [undone] = (await sandbox.snapshot()).commits
    await sandbox.run('git revert HEAD')

    expect((await textOf(sandbox, 'git log -1')).split('\n').slice(-3)).toEqual([
      '    Revert "Add broken feature"',
      '    ',
      `    This reverts commit ${undone?.oid}.`,
    ])
  })

  it('names the move as a revert in the reflog', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    await sandbox.run('git revert HEAD')

    expect((await textOf(sandbox, 'git reflog')).split('\n')[0]).toMatch(
      /^[0-9a-f]{7} HEAD@\{0\}: revert: Revert "Add broken feature"$/,
    )
  })

  it('accepts --no-edit and behaves the same way', async () => {
    const sandbox = await createSandbox(REVERT_SEED)

    expect(await textOf(sandbox, 'git revert HEAD --no-edit')).toContain(
      'Revert "Add broken feature"',
    )
    expect((await sandbox.snapshot()).workdirFiles).toEqual(['index.html', 'style.css'])
  })
})

describe('reverting an older commit', () => {
  it('restores the previous contents of a modified file with HEAD~1', async () => {
    const sandbox = await createSandbox(REVERT_SEED)

    const reverted = await textOf(sandbox, 'git revert HEAD~1')
    expect(reverted).toContain('Revert "Reset the page padding"')
    expect(reverted).toContain(' 1 file changed, 1 insertion(+), 1 deletion(-)')

    expect(await textOf(sandbox, 'cat style.css')).toBe('body { margin: 0; }')
    expect(await textOf(sandbox, 'cat broken-feature.js')).toContain('throw new Error("boom")')
  })

  it('takes a commit hash instead of a HEAD offset', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    const [newest] = (await sandbox.snapshot()).commits

    expect(await textOf(sandbox, `git revert ${newest?.oid}`)).toContain(
      'Revert "Add broken feature"',
    )
    expect((await sandbox.snapshot()).workdirFiles).toEqual(['index.html', 'style.css'])
  })
})

describe('revert refuses rather than losing work', () => {
  it('rejects an unknown revision', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    expect(await textOf(sandbox, 'git revert no-such-commit')).toBe(
      "fatal: bad revision 'no-such-commit'",
    )
  })

  it('refuses a merge commit when no mainline is named', async () => {
    const sandbox = await createSandbox(MERGE_SEED)
    const [merge] = (await sandbox.snapshot()).commits.filter((entry) => entry.parents.length > 1)

    expect(await textOf(sandbox, 'git revert HEAD')).toBe(
      [
        `error: commit ${merge?.oid} is a merge but no -m option was given.`,
        'fatal: revert failed',
      ].join('\n'),
    )
  })

  it('refuses to clobber an uncommitted edit to an affected file', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    await sandbox.run('echo "export const broken = 1" > broken-feature.js')

    expect(await textOf(sandbox, 'git revert HEAD')).toBe(
      [
        'error: Your local changes to the following files would be overwritten by merge:',
        '\tbroken-feature.js',
        'Please commit your changes or stash them before you merge.',
        'Aborting',
        'fatal: revert failed',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'cat broken-feature.js')).toBe('export const broken = 1')
  })

  it('refuses while anything at all is staged', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    await sandbox.run('echo "<h1>Renamed</h1>" > index.html')
    await sandbox.run('git add index.html')

    expect((await textOf(sandbox, 'git revert HEAD')).split('\n')).toEqual([
      'error: Your local changes to the following files would be overwritten by merge:',
      '\tindex.html',
      'Please commit your changes or stash them before you merge.',
      'Aborting',
      'fatal: revert failed',
    ])
    expect((await sandbox.snapshot()).commits).toHaveLength(3)
  })

  it('refuses when a later commit rewrote a file the target commit also changed', async () => {
    const sandbox = await createSandbox(STACKED_SEED)
    const second = (await sandbox.snapshot()).commits.find((entry) => entry.message === 'Second')

    expect(await textOf(sandbox, 'git revert HEAD~1 --no-edit')).toBe(
      [
        'CONFLICT (content): Merge conflict in index.html',
        `error: could not revert ${second?.oid.slice(0, 7)}... Second`,
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'cat index.html')).toBe('<h1>Third</h1>')
    expect((await sandbox.snapshot()).commits).toHaveLength(3)
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })

  it('refuses an already reverted commit instead of recording an empty one', async () => {
    const sandbox = await createSandbox(REMOVED_SEED)
    const added = (await sandbox.snapshot()).commits.find((entry) => entry.message === 'Add notes')

    expect(await textOf(sandbox, `git revert ${added?.oid} --no-edit`)).toBe(
      ['On branch main', 'nothing to commit, working tree clean'].join('\n'),
    )

    const after = await sandbox.snapshot()
    expect(after.commits).toHaveLength(3)
    expect(after.workdirFiles).toEqual(['index.html'])
  })

  it('refuses when the revert would restore a file a later commit deleted', async () => {
    const sandbox = await createSandbox(REWRITTEN_THEN_REMOVED_SEED)
    const updated = (await sandbox.snapshot()).commits.find(
      (entry) => entry.message === 'Update notes',
    )

    expect(await textOf(sandbox, `git revert ${updated?.oid} --no-edit`)).toBe(
      [
        'CONFLICT (content): Merge conflict in notes.txt',
        `error: could not revert ${updated?.oid.slice(0, 7)}... Update notes`,
      ].join('\n'),
    )

    const after = await sandbox.snapshot()
    expect(after.commits).toHaveLength(4)
    expect(after.workdirFiles).toEqual(['index.html'])
  })

  it('still reverts the deletion itself once a file is gone', async () => {
    const sandbox = await createSandbox(REMOVED_SEED)

    expect(await textOf(sandbox, 'git revert HEAD --no-edit')).toContain(
      ' 1 file changed, 1 insertion(+)',
    )
    expect(await textOf(sandbox, 'cat notes.txt')).toBe('First pass')
  })

  it('names the revert options this sandbox does not simulate', async () => {
    const sandbox = await createSandbox(REVERT_SEED)
    expect(await textOf(sandbox, 'git revert --abort')).toBe(
      'fatal: git revert --abort is not simulated in this course.',
    )
  })
})
