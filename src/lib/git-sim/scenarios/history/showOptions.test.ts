import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\ntwo\nthree\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
    { write: { 'f.txt': 'one\ntwo\nthree\nx\n' } },
    { run: 'git commit -q -am second' },
  ],
}

function masked(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH').replace(/^Date: {3}.*$/gm, 'Date:   D')
}

const HEADER = ['commit HASH (HEAD -> main)', 'Author: Your Name <you@example.com>', 'Date:   D', '', '    second']
const STAT = [' f.txt | 1 +', ' 1 file changed, 1 insertion(+)']
const PATCH = ['diff --git a/f.txt b/f.txt', 'index HASH..HASH 100644', '--- a/f.txt', '+++ b/f.txt', '@@ -1,3 +1,4 @@', ' one', ' two', ' three', '+x']

describe('git show <rev>:<path>', () => {
  it('prints a file at a revision', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git show HEAD:f.txt')).toBe('one\ntwo\nthree\nx')
    expect(await textOf(sandbox, 'git show HEAD~1:f.txt')).toBe('one\ntwo\nthree')
  })

  it('prints a file with no final newline as it is', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('n.txt', 'noeol')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm n')

    const [output] = (await sandbox.run('git show HEAD:n.txt')).outputs

    expect(output?.text).toBe('noeol')
    expect(output?.unterminated).toBe(true)
  })

  it('lists a folder', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('d/z.txt', 'z\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm d')

    expect(await textOf(sandbox, 'git show HEAD:d')).toBe('tree HEAD:d\n\nz.txt')
  })

  it('refuses a missing path', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git show HEAD:nope')).toBe("fatal: path 'nope' does not exist in 'HEAD'")
  })

  it('refuses a bad revision', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git show nosuch:f.txt')).toBe("fatal: invalid object name 'nosuch'.")
  })

  it('reads paths relative to a subfolder with ./', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('d/z.txt', 'z\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm d')
    await sandbox.run('cd d')

    expect(await textOf(sandbox, 'git show HEAD:./z.txt')).toBe('z')
  })

  it('hints at the full path from a subfolder', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('d/z.txt', 'z\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm d')
    await sandbox.run('cd d')

    expect(await textOf(sandbox, 'git show HEAD:z.txt')).toBe(
      "fatal: path 'd/z.txt' exists, but not 'z.txt'\nhint: Did you mean 'HEAD:d/z.txt' aka 'HEAD:./z.txt'?",
    )
  })

  it('reads the index with an empty revision', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('f.txt', 'staged\n')
    await sandbox.run('git add f.txt')

    expect(await textOf(sandbox, 'git show :f.txt')).toBe('staged')
  })
})

describe('git show body options', () => {
  it.each([['-s'], ['--no-patch']])('%s hides the diff', async (option) => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, `git show ${option}`))).toBe(HEADER.join('\n'))
  })

  it('lists names with --name-only', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show --name-only'))).toBe([...HEADER, '', 'f.txt'].join('\n'))
  })

  it('reads --oneline with a patch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show --oneline'))).toBe(['HASH (HEAD -> main) second', ...PATCH].join('\n'))
  })

  it('reads --oneline -s', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show --oneline -s'))).toBe('HASH (HEAD -> main) second')
  })

  it('reads --format with a patch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show --format=%s'))).toBe(['second', '', ...PATCH].join('\n'))
  })

  it('reads --format with -s', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git show --format=%s -s')).toBe('second')
  })

  it('prints only the stat with an empty format', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git show --format= --stat')).toBe(STAT.join('\n'))
  })

  it('prints nothing with an empty format and -s', async () => {
    const sandbox = await createSandbox(SEED)

    expect((await sandbox.run('git show -s --format=')).outputs).toEqual([])
  })

  it('reads a named revision with options', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show -s --oneline HEAD~1'))).toBe('HASH Initial commit')
  })

  it('reads --pretty=oneline', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show --pretty=oneline -s'))).toBe('HASH (HEAD -> main) second')
  })

  it('reads -p explicitly', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show -p'))).toBe([...HEADER, '', ...PATCH].join('\n'))
  })
})

describe('git show with paths', () => {
  it('limits the patch to a path after --', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('g.txt', 'alpha\n')
    await sandbox.writeFile('f.txt', 'one\ntwo\nthree\nx\ny\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm both')

    const text = masked(await textOf(sandbox, 'git show --oneline HEAD -- g.txt'))

    expect(text).toContain('diff --git a/g.txt b/g.txt')
    expect(text).not.toContain('a/f.txt')
  })
})

describe('git show of a merge with a conflict resolution', () => {
  async function resolvedMerge(): Promise<Sandbox> {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'f.txt': 'one\ntwo\nthree\n' } },
        { run: 'git add .' },
        { run: 'git commit -q -m base' },
        { run: 'git switch -q -c o' },
        { write: { 'f.txt': 'one\nTWO-theirs\nthree\n' } },
        { run: 'git commit -qam o' },
        { run: 'git switch -q main' },
        { write: { 'f.txt': 'one\nTWO-ours\nthree\n' } },
        { run: 'git commit -qam m' },
      ],
    })
    await sandbox.run('git merge o')
    await sandbox.writeFile('f.txt', 'one\nresolved\nthree\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm merged')
    return sandbox
  }

  it('prints a combined diff', async () => {
    const sandbox = await resolvedMerge()

    expect(masked(await textOf(sandbox, 'git show'))).toBe(
      [
        'commit HASH (HEAD -> main)',
        'Merge: HASH HASH',
        'Author: Your Name <you@example.com>',
        'Date:   D',
        '',
        '    merged',
        '',
        'diff --cc f.txt',
        'index HASH,HASH..HASH',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@@ -1,3 -1,3 +1,3 @@@',
        '  one',
        '- TWO-ours',
        ' -TWO-theirs',
        '++resolved',
        '  three',
      ].join('\n'),
    )
  })

  it('still prints only the header for -s', async () => {
    const sandbox = await resolvedMerge()

    expect(masked(await textOf(sandbox, 'git show -s'))).not.toContain('diff')
  })
})
