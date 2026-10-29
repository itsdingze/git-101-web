import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const IGNORE_RULES = [
  '# Junk from tools',
  '',
  '*.log',
  'build/',
  'node_modules/',
  '!error.log',
  '',
].join('\n')

const IGNORED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    {
      write: {
        '.gitignore': IGNORE_RULES,
        'app.js': 'console.log("hi")\n',
        'debug.log': 'noise\n',
        'error.log': 'boom\n',
        'build/bundle.js': 'bundled\n',
        'node_modules/left-pad/index.js': 'pad\n',
      },
    },
  ],
}

const TRACKED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'app.js': 'one\n', '.env': 'SECRET=1\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { '.gitignore': '.env\n' } },
  ],
}

async function ignoredSectionOf(sandbox: Sandbox): Promise<string[]> {
  const lines = (await textOf(sandbox, 'git status --ignored')).split('\n')
  const start = lines.indexOf('Ignored files:')
  if (start === -1) return []
  return lines
    .slice(start + 2)
    .filter((line) => line.startsWith('\t'))
    .map((line) => line.slice(1))
}

describe('git status with a .gitignore', () => {
  it('leaves ignored files out of the untracked list', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\t.gitignore',
        '\tapp.js',
        '\terror.log',
        '',
        'nothing added to commit but untracked files present (use "git add" to track)',
      ].join('\n'),
    )
  })

  it('lists them under Ignored files with --ignored, folding whole folders', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git status --ignored')).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\t.gitignore',
        '\tapp.js',
        '\terror.log',
        '',
        'Ignored files:',
        '  (use "git add -f <file>..." to include in what will be committed)',
        '\tbuild/',
        '\tdebug.log',
        '\tnode_modules/',
        '',
        'nothing added to commit but untracked files present (use "git add" to track)',
      ].join('\n'),
    )
  })

  it('reports a clean tree when only ignored files are left over', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Initial commit"')

    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })
})

describe('git add with a .gitignore', () => {
  it('skips ignored files when adding everything', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)
    await sandbox.run('git add .')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'Changes to be committed:',
        '  (use "git rm --cached <file>..." to unstage)',
        '\tnew file:   .gitignore',
        '\tnew file:   app.js',
        '\tnew file:   error.log',
        '',
      ].join('\n'),
    )
  })

  it('stages a single ignored file when forced', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)
    expect(await textOf(sandbox, 'git add -f debug.log')).toBe('')

    expect(await textOf(sandbox, 'git status')).toContain('new file:   debug.log')
  })

  it('stages a whole ignored folder when forced', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)
    await sandbox.run('git add -f node_modules/')

    expect(await textOf(sandbox, 'git status')).toContain(
      'new file:   node_modules/left-pad/index.js',
    )
  })

  it('refuses an ignored file without -f and says why', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git add debug.log')).toBe(
      [
        'The following paths are ignored by one of your .gitignore files:',
        'debug.log',
        'hint: Use -f if you really want to add them.',
        'hint: Turn this message off by running',
        'hint: "git config advice.addIgnoredFile false"',
      ].join('\n'),
    )
  })

  it('stages the other paths and lists every ignored one, like git add * does', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git add app.js build debug.log')).toBe(
      [
        'The following paths are ignored by one of your .gitignore files:',
        'build',
        'debug.log',
        'hint: Use -f if you really want to add them.',
        'hint: Turn this message off by running',
        'hint: "git config advice.addIgnoredFile false"',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'git status --short')).toContain('A  app.js')
  })

  it('stages nothing when one path matches no file at all', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git add app.js debug.log nowhere.txt')).toBe(
      "fatal: pathspec 'nowhere.txt' did not match any files",
    )
    expect(await textOf(sandbox, 'git status --short')).not.toContain('A  app.js')
  })

  it('refuses an ignored folder without -f', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git add build')).toContain(
      'The following paths are ignored by one of your .gitignore files:',
    )
  })

  it('still reports a plain pathspec miss for a file that does not exist', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git add nowhere.txt')).toBe(
      "fatal: pathspec 'nowhere.txt' did not match any files",
    )
  })
})

describe('gitignore pattern syntax', () => {
  it('rescues a file named after a ! rule', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await textOf(sandbox, 'git status')).toContain('\terror.log')
    expect(await ignoredSectionOf(sandbox)).toEqual(['build/', 'debug.log', 'node_modules/'])
  })

  it('treats # lines and blank lines as nothing', async () => {
    const sandbox = await createSandbox({
      dir: 'my-project',
      setup: [
        { run: 'git init' },
        { write: { '.gitignore': '\n# nothing here\n\n', 'notes.txt': 'hi\n' } },
      ],
    })

    expect(await textOf(sandbox, 'git status')).toContain('notes.txt')
    expect(await textOf(sandbox, 'git status --ignored')).not.toContain('Ignored files:')
  })
})

describe('a rule added after the file was committed', () => {
  it('keeps tracking the file and still stages its edits', async () => {
    const sandbox = await createSandbox(TRACKED_SEED)
    await sandbox.run('echo "SECRET=2" > .env')

    expect(await textOf(sandbox, 'git status')).toContain('modified:   .env')

    await sandbox.run('git add .')
    expect(await textOf(sandbox, 'git status')).toContain('modified:   .env')
    expect(await textOf(sandbox, 'git status')).not.toContain('Changes not staged for commit')
  })

  it('never lists a tracked file as ignored', async () => {
    const sandbox = await createSandbox(TRACKED_SEED)

    expect(await textOf(sandbox, 'git status --ignored')).not.toContain('Ignored files:')
  })

  it('drops the file from status once git rm --cached untracks it', async () => {
    const sandbox = await createSandbox(TRACKED_SEED)
    await sandbox.run('git add .gitignore')

    expect(await textOf(sandbox, 'git rm --cached .env')).toBe("rm '.env'")

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'Changes to be committed:',
        '  (use "git restore --staged <file>..." to unstage)',
        '\tdeleted:    .env',
        '\tnew file:   .gitignore',
        '',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'cat .env')).toBe('SECRET=1')
  })

  it('untracks a whole folder with git rm -r --cached', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)
    await sandbox.run('git add -f node_modules/')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Initial commit"')

    expect(await textOf(sandbox, 'git rm -r --cached node_modules/')).toBe(
      "rm 'node_modules/left-pad/index.js'",
    )

    const status = await textOf(sandbox, 'git status')
    expect(status).toContain('deleted:    node_modules/left-pad/index.js')
    expect(status).not.toContain('Untracked files:')
    expect(await ignoredSectionOf(sandbox)).toContain('node_modules/')
  })

  it('shows the untracked copy under --ignored once the rule applies', async () => {
    const sandbox = await createSandbox(TRACKED_SEED)
    await sandbox.run('git rm --cached .env')

    expect(await textOf(sandbox, 'git status --ignored')).toContain('\t.env')
  })
})
