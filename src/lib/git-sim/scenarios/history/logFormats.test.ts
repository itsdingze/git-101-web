import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
    { write: { 'f.txt': 'one\ntwo\nthree\nx\n' } },
    { run: 'git commit -q -am second' },
  ],
}

const HASH = '[0-9a-f]{7}'

function masked(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH').replace(/^Date: {3}.*$/gm, 'Date:   D')
}

const SECOND_HEADER = ['commit HASH (HEAD -> main)', 'Author: Your Name <you@example.com>', 'Date:   D', '', '    second']
const INITIAL_HEADER = ['commit HASH', 'Author: Your Name <you@example.com>', 'Date:   D', '', '    Initial commit']
const SECOND_STAT = [' f.txt | 1 +', ' 1 file changed, 1 insertion(+)']
const INITIAL_STAT = [' f.txt | 3 +++', ' g.txt | 1 +', ' 2 files changed, 4 insertions(+)']
const SECOND_PATCH = ['diff --git a/f.txt b/f.txt', 'index HASH..HASH 100644', '--- a/f.txt', '+++ b/f.txt', '@@ -1,3 +1,4 @@', ' one', ' two', ' three', '+x']

async function sandboxWithMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -q -c other')
  await sandbox.writeFile('g.txt', 'alpha\nbeta\n')
  await sandbox.run('git commit -qam other')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', 'ONE\ntwo\nthree\nx\n')
  await sandbox.run('git commit -qam main')
  await sandbox.run('git merge -q other -m merged')
  return sandbox
}

describe('git log --stat', () => {
  it('prints each commit with its stat', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --stat'))).toBe(
      [...SECOND_HEADER, '', ...SECOND_STAT, '', ...INITIAL_HEADER, '', ...INITIAL_STAT].join('\n'),
    )
  })

  it('pairs with --oneline without blank lines', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --stat --oneline'))).toBe(
      ['HASH (HEAD -> main) second', ...SECOND_STAT, 'HASH Initial commit', ...INITIAL_STAT].join('\n'),
    )
  })

  it('shows nothing for a merge commit', async () => {
    const sandbox = await sandboxWithMerge()

    expect(masked(await textOf(sandbox, 'git log --oneline --stat -1'))).toBe('HASH (HEAD -> main) merged')
  })
})

describe('git log -p', () => {
  it('prints each commit with its patch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log -p -1'))).toBe([...SECOND_HEADER, '', ...SECOND_PATCH].join('\n'))
  })

  it('separates commits with a blank line', async () => {
    const sandbox = await createSandbox(SEED)

    const text = masked(await textOf(sandbox, 'git log -p'))

    expect(text.split('\n').filter((line) => line === 'commit HASH')).toHaveLength(1)
    expect(text).toContain('+x\n\ncommit HASH\n')
  })

  it('reads --patch the same way', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --patch --oneline -1'))).toBe(['HASH (HEAD -> main) second', ...SECOND_PATCH].join('\n'))
  })

  it('shows no diff for a merge commit', async () => {
    const sandbox = await sandboxWithMerge()

    expect(masked(await textOf(sandbox, 'git log -p -1'))).not.toContain('diff')
  })

  it('combines with --stat using a divider', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --stat -p -1'))).toBe(
      [...SECOND_HEADER, '---', ...SECOND_STAT, '', ...SECOND_PATCH].join('\n'),
    )
  })
})

describe('git log --format', () => {
  it('prints a placeholder per commit', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --format=%h')).toMatch(new RegExp(`^${HASH}\n${HASH}$`))
  })

  it('reads text and several placeholders', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --format="%h %s (%an)"'))).toBe(
      'HASH second (Your Name)\nHASH Initial commit (Your Name)',
    )
  })

  it('prints nothing for an empty format', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --format= -1')).toBe('')
  })

  it('prints only the stat for an empty format', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --format= --stat'))).toBe([...SECOND_STAT, ...INITIAL_STAT].join('\n'))
  })

  it('separates format output from a stat with a blank line and no blank between commits', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --format=%h --stat'))).toBe(
      ['HASH', '', ...SECOND_STAT, 'HASH', '', ...INITIAL_STAT].join('\n'),
    )
  })

  it('expands the common placeholders', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, "git log -1 --format='%H %P %T %s %b %ae %cn %ce %%'"))).toBe(
      'HASH HASH HASH second  you@example.com Your Name you@example.com %',
    )
  })

  it('expands decorations', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log -1 --format="%d|%D"')).toBe(' (HEAD -> main)|HEAD -> main')
  })

  it('expands a relative date', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log -1 --format=%ar')).toMatch(/^\d+ (second|minute|hour|day|week|month|year)s?(, \d+ months?)? ago$/)
  })

  it('reads a newline placeholder and keeps unknown placeholders', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log -1 --format="%s%n%x"')).toBe('second\n%x')
  })
})

describe('git log --pretty', () => {
  it('reads oneline with full hashes', async () => {
    const sandbox = await createSandbox(SEED)

    const text = await textOf(sandbox, 'git log --pretty=oneline')

    expect(text.split('\n')[0]).toMatch(/^[0-9a-f]{40} \(HEAD -> main\) second$/)
  })

  it('reads short', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --pretty=short -1'))).toBe(
      ['commit HASH (HEAD -> main)', 'Author: Your Name <you@example.com>', '', '    second'].join('\n'),
    )
  })

  it('reads format: as separators with no final newline', async () => {
    const sandbox = await createSandbox(SEED)

    const result = await sandbox.run('git log --pretty=format:%s')

    expect(result.outputs.map((output) => output.text).join('\n')).toBe('second\nInitial commit')
    expect(result.outputs[result.outputs.length - 1]?.unterminated).toBe(true)
  })

  it('reads tformat: with one line per commit', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --pretty=tformat:%s')).toBe('second\nInitial commit')
  })

  it('needs a value on --format', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --format')).toBe('fatal: unrecognized argument: --format')
  })
})

describe('git log -p with paths', () => {
  it('limits the patch to the named paths', async () => {
    const sandbox = await createSandbox(SEED)

    const patch = masked(await textOf(sandbox, 'git log -p --oneline -- g.txt'))

    expect(patch).toContain('g.txt')
    expect(patch).not.toContain('diff --git a/f.txt')
  })

  it('limits the stat to the named paths', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --stat --oneline -- f.txt'))).toBe(
      ['HASH (HEAD -> main) second', ...SECOND_STAT, 'HASH Initial commit', ' f.txt | 3 +++', ' 1 file changed, 3 insertions(+)'].join('\n'),
    )
  })
})

describe('git log --reverse', () => {
  it('shows oldest first', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --reverse --oneline'))).toBe('HASH Initial commit\nHASH (HEAD -> main) second')
  })

  it('limits before reversing', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --reverse -n1 --oneline'))).toBe('HASH (HEAD -> main) second')
  })

  it('cannot be combined with --graph', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --reverse --graph')).toBe("fatal: options '--graph' and '--reverse' cannot be used together")
  })
})

describe('git log count forms', () => {
  it.each([['-n1'], ['-n 1'], ['-1'], ['--max-count=1']])('reads %s', async (form) => {
    const sandbox = await createSandbox(SEED)

    expect((await textOf(sandbox, `git log --oneline ${form}`)).split('\n')).toHaveLength(1)
  })
})

describe('git log --graph with a format', () => {
  it('draws the graph around the format', async () => {
    const sandbox = await sandboxWithMerge()

    expect(await textOf(sandbox, 'git log --graph --format=%s')).toContain('*   merged')
  })
})
