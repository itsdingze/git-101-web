import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    {
      write: {
        'index.html': '<h1>My project</h1>\n',
        'style.css': 'body { margin: 0; }\n',
      },
    },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

async function dirtySandbox(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('echo "<h1>Renamed project</h1>" > index.html')
  await sandbox.run('echo "console.log(1)" > app.js')
  await sandbox.run('git add app.js')
  await sandbox.run('echo "scratch" > notes.txt')
  return sandbox
}

describe('git stash push', () => {
  it('shelves tracked edits and staged new files, then reports the clean tree', async () => {
    const sandbox = await dirtySandbox()

    expect(await textOf(sandbox, 'git stash')).toMatch(
      /^Saved working directory and index state WIP on main: [0-9a-f]{7} Initial commit$/,
    )
    expect(await textOf(sandbox, 'cat index.html')).toBe('<h1>My project</h1>')
    expect(await textOf(sandbox, 'ls')).toBe('index.html  notes.txt  style.css')
  })

  it('leaves a never-added untracked file in the working directory', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\tnotes.txt',
        '',
        'nothing added to commit but untracked files present (use "git add" to track)',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'cat notes.txt')).toBe('scratch')
  })

  it('shelves the untracked file too with -u', async () => {
    const sandbox = await dirtySandbox()

    expect(await textOf(sandbox, 'git stash -u')).toContain(
      'Saved working directory and index state WIP on main:',
    )
    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })

  it('accepts the explicit push form with a message', async () => {
    const sandbox = await dirtySandbox()

    expect(await textOf(sandbox, 'git stash push -m "half-finished header"')).toBe(
      'Saved working directory and index state On main: half-finished header',
    )
    expect(await textOf(sandbox, 'git stash list')).toBe(
      'stash@{0}: On main: half-finished header',
    )
  })

  it('accepts a message bundled behind another short flag', async () => {
    const sandbox = await dirtySandbox()

    expect(await textOf(sandbox, 'git stash -am "half-finished header"')).toBe(
      'Saved working directory and index state On main: half-finished header',
    )
    expect(await textOf(sandbox, 'git stash list')).toBe('stash@{0}: On main: half-finished header')
  })

  it('accepts a quoted message joined straight onto -m', async () => {
    const sandbox = await dirtySandbox()

    expect(await textOf(sandbox, 'git stash push -m"half-finished header"')).toBe(
      'Saved working directory and index state On main: half-finished header',
    )
  })

  it('keeps the shelved snapshot out of the branch history', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash -u')

    expect(await textOf(sandbox, 'git log --oneline')).toMatch(
      /^[0-9a-f]{7} \(HEAD -> main\) Initial commit$/,
    )
    expect((await sandbox.snapshot()).commits).toHaveLength(1)
  })

  it('names the same stash commit on every run', async () => {
    const first = await dirtySandbox()
    const second = await dirtySandbox()
    await first.run('git stash -u')
    await second.run('git stash -u')

    expect(await textOf(first, 'git stash drop')).toBe(await textOf(second, 'git stash drop'))
  })

  it('says there is nothing to save when the working tree is clean', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git stash')).toBe('No local changes to save')
    expect(await textOf(sandbox, 'git stash list')).toBe('')
  })

  it('says there is nothing to save when only untracked files are present', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "scratch" > notes.txt')

    expect(await textOf(sandbox, 'git stash')).toBe('No local changes to save')
    expect(await textOf(sandbox, 'git stash -u')).toContain('Saved working directory')
  })
})

describe('git stash list', () => {
  it('numbers entries with the newest first', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "one" > index.html')
    await sandbox.run('git stash push -m "first"')
    await sandbox.run('echo "two" > index.html')
    await sandbox.run('git stash push -m "second"')

    expect(await textOf(sandbox, 'git stash list')).toBe(
      ['stash@{0}: On main: second', 'stash@{1}: On main: first'].join('\n'),
    )
  })
})

describe('git stash pop', () => {
  it('restores the changes as unstaged work and drops the entry', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash -u')

    const popped = await textOf(sandbox, 'git stash pop')
    expect(popped).toContain('Changes to be committed:')
    expect(popped).toContain('\tnew file:   app.js')
    expect(popped).toContain('Changes not staged for commit:')
    expect(popped).toContain('\tmodified:   index.html')
    expect(popped).toContain('Untracked files:')
    expect(popped).toContain('\tnotes.txt')
    expect(popped).toMatch(/\n\nDropped refs\/stash@\{0\} \([0-9a-f]{40}\)$/)

    expect(await textOf(sandbox, 'cat index.html')).toBe('<h1>Renamed project</h1>')
    expect(await textOf(sandbox, 'git stash list')).toBe('')
  })

  it('prints Dropped straight after the status footer, with no blank line', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "wip" > index.html')
    await sandbox.run('git stash')

    const popped = await textOf(sandbox, 'git stash pop')
    expect(popped).toMatch(
      /\n\tmodified: {3}index\.html\n\nno changes added to commit \(use "git add" and\/or "git commit -a"\)\nDropped refs\/stash@\{0\} \([0-9a-f]{40}\)$/,
    )
  })

  it('brings a file that was staged before the stash back as a staged new file', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash')

    const popped = await textOf(sandbox, 'git stash pop')
    expect(popped).toContain('Changes to be committed:')
    expect(popped).toContain('\tnew file:   app.js')
    expect(popped).toContain('Changes not staged for commit:')
    expect(popped).toContain('\tmodified:   index.html')
    expect(popped).toContain('Untracked files:')
    expect(popped).toContain('\tnotes.txt')
  })

  it('leaves a file committed after the stash was taken alone', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "wip" > index.html')
    await sandbox.run('git stash')
    await sandbox.run('echo "console.log(1)" > feature.js')
    await sandbox.run('git add feature.js')
    await sandbox.run('git commit -m "Add feature"')

    await sandbox.run('git stash pop')

    expect(await textOf(sandbox, 'ls')).toBe('feature.js  index.html  style.css')
    expect(await textOf(sandbox, 'cat feature.js')).toBe('console.log(1)')
    expect(await textOf(sandbox, 'cat index.html')).toBe('wip')
  })

  it('restores a stashed deletion', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('rm style.css')
    await sandbox.run('git stash')

    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')
    expect(await textOf(sandbox, 'git stash pop')).toContain('\tdeleted:    style.css')
    expect(await textOf(sandbox, 'ls')).toBe('index.html')
  })

  it('round-trips a file inside a folder', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('mkdir src')
    await sandbox.run('echo "console.log(1)" > src/app.js')
    await sandbox.run('git add src/app.js')
    await sandbox.run('git commit -m "Add the script"')
    await sandbox.run('echo "console.log(2)" > src/app.js')

    await sandbox.run('git stash')
    expect(await textOf(sandbox, 'cat src/app.js')).toBe('console.log(1)')

    await sandbox.run('git stash pop')
    expect(await textOf(sandbox, 'cat src/app.js')).toBe('console.log(2)')
  })

  it('walks back through the stack, newest entry first', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "one" > index.html')
    await sandbox.run('git stash')
    await sandbox.run('echo "two" > index.html')
    await sandbox.run('git stash')

    await sandbox.run('git stash pop')
    expect(await textOf(sandbox, 'cat index.html')).toBe('two')

    await sandbox.run('git restore index.html')
    await sandbox.run('git stash pop')
    expect(await textOf(sandbox, 'cat index.html')).toBe('one')
    expect(await textOf(sandbox, 'git stash list')).toBe('')
  })
})

describe('git stash apply, drop, and clear', () => {
  it('keeps the entry after an apply', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash -u')

    const applied = await textOf(sandbox, 'git stash apply')
    expect(applied).toContain('\tmodified:   index.html')
    expect(applied).not.toContain('Dropped')

    expect(await textOf(sandbox, 'cat index.html')).toBe('<h1>Renamed project</h1>')
    expect(await textOf(sandbox, 'git stash list')).toContain('stash@{0}: WIP on main:')
  })

  it('discards the newest entry without restoring it', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash push -m "keep me"')
    await sandbox.run('echo "later" > style.css')
    await sandbox.run('git stash push -m "throw me away"')

    expect(await textOf(sandbox, 'git stash drop')).toMatch(
      /^Dropped refs\/stash@\{0\} \([0-9a-f]{40}\)$/,
    )
    expect(await textOf(sandbox, 'cat style.css')).toBe('body { margin: 0; }')
    expect(await textOf(sandbox, 'git stash list')).toBe('stash@{0}: On main: keep me')
  })

  it('empties the whole stack with clear', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash')
    await sandbox.run('echo "later" > style.css')
    await sandbox.run('git stash')

    expect(await textOf(sandbox, 'git stash clear')).toBe('')
    expect(await textOf(sandbox, 'git stash list')).toBe('')
    expect(await textOf(sandbox, 'git status')).toContain(
      'nothing added to commit but untracked files present',
    )
    expect(await textOf(sandbox, 'cat style.css')).toBe('body { margin: 0; }')
  })
})

describe('git stash on a named entry', () => {
  async function twoEntrySandbox(): Promise<Sandbox> {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "one" > index.html')
    await sandbox.run('git stash push -m "first"')
    await sandbox.run('echo "two" > style.css')
    await sandbox.run('git stash push -m "second"')
    return sandbox
  }

  it('drops the entry it names and keeps the rest', async () => {
    const sandbox = await twoEntrySandbox()

    expect(await textOf(sandbox, 'git stash drop stash@{1}')).toMatch(
      /^Dropped stash@\{1\} \([0-9a-f]{40}\)$/,
    )
    expect(await textOf(sandbox, 'git stash list')).toBe('stash@{0}: On main: second')
  })

  it('pops the entry it names', async () => {
    const sandbox = await twoEntrySandbox()

    expect(await textOf(sandbox, 'git stash pop stash@{1}')).toMatch(
      /\nDropped stash@\{1\} \([0-9a-f]{40}\)$/,
    )
    expect(await textOf(sandbox, 'cat index.html')).toBe('one')
    expect(await textOf(sandbox, 'cat style.css')).toBe('body { margin: 0; }')
    expect(await textOf(sandbox, 'git stash list')).toBe('stash@{0}: On main: second')
  })

  it('applies the entry it names and keeps it', async () => {
    const sandbox = await twoEntrySandbox()
    await sandbox.run('git stash apply stash@{1}')

    expect(await textOf(sandbox, 'cat index.html')).toBe('one')
    expect(await textOf(sandbox, 'git stash list')).toBe(
      ['stash@{0}: On main: second', 'stash@{1}: On main: first'].join('\n'),
    )
  })

  it('reads a bare number as that entry', async () => {
    const sandbox = await twoEntrySandbox()

    expect(await textOf(sandbox, 'git stash drop 1')).toMatch(
      /^Dropped refs\/stash@\{1\} \([0-9a-f]{40}\)$/,
    )
    expect(await textOf(sandbox, 'git stash list')).toBe('stash@{0}: On main: second')
  })

  it('refuses an entry past the end of the stack', async () => {
    const sandbox = await twoEntrySandbox()

    expect(await textOf(sandbox, 'git stash drop stash@{5}')).toBe(
      "fatal: log for 'stash' only has 2 entries",
    )
    expect(await textOf(sandbox, 'git stash list')).toContain('stash@{1}: On main: first')
  })
})

describe('git stash errors', () => {
  it('refuses to pop an empty stash', async () => {
    const sandbox = await dirtySandbox()

    expect(await textOf(sandbox, 'git stash pop')).toBe('No stash entries found.')
    expect(await textOf(sandbox, 'git stash apply')).toBe('No stash entries found.')
    expect(await textOf(sandbox, 'git stash drop')).toBe('No stash entries found.')
  })

  it('refuses to pop after the stack has been cleared', async () => {
    const sandbox = await dirtySandbox()
    await sandbox.run('git stash')
    await sandbox.run('git stash clear')

    expect(await textOf(sandbox, 'git stash pop')).toBe('No stash entries found.')
  })

  it('rejects an unknown subcommand the way git does', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git stash unshelve')).toBe(
      "fatal: subcommand wasn't specified; 'push' can't be assumed due to unexpected token 'unshelve'",
    )
  })

  it('refuses to stash before the first commit', async () => {
    const sandbox = await createSandbox({
      dir: 'my-project',
      setup: [{ run: 'git init' }, { write: { 'index.html': '<h1>Hi</h1>\n' } }, { run: 'git add .' }],
    })

    expect(await textOf(sandbox, 'git stash')).toBe('You do not have the initial commit yet')
  })
})

describe('real stash subcommands the sandbox does not model', () => {
  it.each(['show', 'branch x', 'save "old"'])('say git stash %s is not simulated', async (rest) => {
    const sandbox = await dirtySandbox()
    const name = rest.split(' ')[0]

    expect(await textOf(sandbox, `git stash ${rest}`)).toBe(
      `fatal: this course doesn't simulate git stash ${name}.`,
    )
  })
})
