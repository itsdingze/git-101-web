import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
    { write: { 'f.txt': 'one\ntwo\n', 'u.txt': 'u\n', 'dd/v.txt': 'v\n' } },
  ],
}

const REMOTE_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [{ write: { 'f.txt': 'one\n' } }, { run: 'git add .' }, { run: 'git commit -q -m "Initial commit"' }],
  },
}

const SHORT = ' M f.txt\n?? dd/\n?? u.txt'

const UNSTAGED_SECTION = [
  'Changes not staged for commit:',
  '  (use "git add <file>..." to update what will be committed)',
  '  (use "git restore <file>..." to discard changes in working directory)',
  '\tmodified:   f.txt',
  '',
]

const NO_CHANGES_ADDED = 'no changes added to commit (use "git add" and/or "git commit -a")'

async function dirty(): Promise<Sandbox> {
  return createSandbox(SEED)
}

describe('git status machine formats', () => {
  it.each([['--porcelain'], ['--porcelain=v1'], ['--porcelain=1']])('reads %s', async (option) => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, `git status ${option}`)).toBe(SHORT)
  })

  it('refuses a version it does not simulate', async () => {
    const sandbox = await dirty()

    expect((await sandbox.run('git status --porcelain=v2')).outputs).toEqual([
      { stream: 'stderr', prose: true, text: "This practice terminal doesn't simulate --porcelain=v2 for git status. Check the spelling, or run the command without it." },
    ])
  })

  it('refuses a version git does not know', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status --porcelain=v9')).toBe("fatal: unsupported porcelain version 'v9'")
  })

  it('separates entries with NUL under -z', async () => {
    const sandbox = await dirty()

    const [output] = (await sandbox.run('git status -z')).outputs

    expect(output?.text).toBe(' M f.txt\0?? dd/\0?? u.txt\0')
    expect(output?.unterminated).toBe(true)
  })

  it('reads --short -z the same way', async () => {
    const sandbox = await dirty()

    const [output] = (await sandbox.run('git status --short -z')).outputs

    expect(output?.text).toBe(' M f.txt\0?? dd/\0?? u.txt\0')
  })

  it('stays relative to the top of the repository with --porcelain', async () => {
    const sandbox = await dirty()
    await sandbox.run('cd dd')

    expect(await textOf(sandbox, 'git status --porcelain')).toBe(SHORT)
  })

  it('stays relative to the current folder with -s', async () => {
    const sandbox = await dirty()
    await sandbox.run('cd dd')

    expect(await textOf(sandbox, 'git status -s')).toBe(' M ../f.txt\n?? ./\n?? ../u.txt')
  })
})

describe('git status branch headers', () => {
  it.each([['-sb'], ['-s -b'], ['--short --branch']])('%s prints the branch first', async (options) => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, `git status ${options}`)).toBe(`## main\n${SHORT}`)
  })

  it('combines with --porcelain', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status --porcelain -b')).toBe(`## main\n${SHORT}`)
  })

  it('shows the upstream', async () => {
    const sandbox = await createSandbox(REMOTE_SEED)

    expect(await textOf(sandbox, 'git status -sb')).toBe('## main...origin/main')
  })

  it('shows how far ahead', async () => {
    const sandbox = await createSandbox(REMOTE_SEED)
    await sandbox.writeFile('f.txt', 'one\ntwo\n')
    await sandbox.run('git commit -qam x')

    expect(await textOf(sandbox, 'git status -sb')).toBe('## main...origin/main [ahead 1]')
  })

  it('names an unborn branch', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }] })

    expect(await textOf(sandbox, 'git status -sb')).toBe('## No commits yet on main')
  })

  it('marks a deleted upstream', async () => {
    const sandbox = await createSandbox(REMOTE_SEED)
    await sandbox.run('git switch -c x')
    await sandbox.run('git push -u origin x')
    await sandbox.run('git push origin --delete x')

    expect(await textOf(sandbox, 'git status -sb')).toBe('## x...origin/x [gone]')
  })
})

describe('git status with a path', () => {
  it('limits the long format', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status f.txt')).toBe(['On branch main', ...UNSTAGED_SECTION, NO_CHANGES_ADDED].join('\n'))
  })

  it('reports a clean path as clean', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status g.txt')).toBe('On branch main\nnothing to commit, working tree clean')
  })

  it('limits the short format', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status -s g.txt')).toBe('')
    expect(await textOf(sandbox, 'git status -s u.txt')).toBe('?? u.txt')
  })

  it('finds an untracked path', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status u.txt')).toBe(
      [
        'On branch main',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\tu.txt',
        '',
        'nothing added to commit but untracked files present (use "git add" to track)',
      ].join('\n'),
    )
  })
})

describe('git status untracked modes', () => {
  it.each([['-uno'], ['--untracked-files=no']])('%s hides untracked files', async (option) => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, `git status ${option}`)).toBe(['On branch main', ...UNSTAGED_SECTION, NO_CHANGES_ADDED].join('\n'))
    expect(await textOf(sandbox, `git status -s ${option}`)).toBe(' M f.txt')
  })

  it.each([['-uall'], ['-u'], ['--untracked-files=all'], ['--untracked-files']])('%s expands untracked folders', async (option) => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, `git status -s ${option}`)).toBe(' M f.txt\n?? dd/v.txt\n?? u.txt')
  })

  it('collapses folders with -unormal', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status -s -unormal')).toBe(SHORT)
  })

  it('refuses an unknown mode', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git status -ubogus')).toBe("fatal: Invalid untracked files mode 'bogus'")
  })

  it('says nothing is listed when only untracked files exist', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [{ run: 'git init' }, { write: { 'f.txt': 'x\n' } }, { run: 'git add .' }, { run: 'git commit -q -m c' }, { write: { 'u.txt': 'u\n' } }],
    })

    expect(await textOf(sandbox, 'git status -uno')).toBe('On branch main\nnothing to commit (use -u to show untracked files)')
  })

  it('notes untracked files are not listed when something is staged', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add f.txt')

    expect(await textOf(sandbox, 'git status -uno')).toBe(
      [
        'On branch main',
        'Changes to be committed:',
        '  (use "git restore --staged <file>..." to unstage)',
        '\tmodified:   f.txt',
        '',
        'Untracked files not listed (use -u option to show untracked files)',
      ].join('\n'),
    )
  })
})
