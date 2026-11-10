import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

function masked(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH')
}

describe('diff --cc with short sides', () => {
  it('writes both range numbers for one-line hunks', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 's.txt': 'x\n' } },
        { run: 'git add .' },
        { run: 'git commit -qm b' },
        { run: 'git switch -q -c o' },
        { write: { 's.txt': 't\n' } },
        { run: 'git commit -qam o' },
        { run: 'git switch -q main' },
        { write: { 's.txt': 'm\n' } },
        { run: 'git commit -qam m' },
      ],
    })
    await sandbox.run('git merge o')
    await sandbox.writeFile('s.txt', 'r\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm merged')

    expect(masked(await textOf(sandbox, 'git show --format='))).toBe(
      ['diff --cc s.txt', 'index HASH,HASH..HASH', '--- a/s.txt', '+++ b/s.txt', '@@@ -1,1 -1,1 +1,1 @@@', '- m', ' -t', '++r'].join('\n'),
    )
  })

  it('keeps sides that lack a final newline', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'n.txt': 'base' } },
        { run: 'git add .' },
        { run: 'git commit -qm b' },
        { run: 'git switch -q -c o' },
        { write: { 'n.txt': 'theirs' } },
        { run: 'git commit -qam o' },
        { run: 'git switch -q main' },
        { write: { 'n.txt': 'ours' } },
        { run: 'git commit -qam m' },
      ],
    })
    await sandbox.run('git merge o')

    expect(masked(await textOf(sandbox, 'git diff'))).toBe(
      [
        'diff --cc n.txt',
        'index HASH,HASH..HASH',
        '--- a/n.txt',
        '+++ b/n.txt',
        '@@@ -1,1 -1,1 +1,5 @@@',
        '- ours',
        ' -theirs',
        '++<<<<<<< HEAD',
        '++ours',
        '++=======',
        '++theirs',
        '++>>>>>>> o',
      ].join('\n'),
    )
  })
})
