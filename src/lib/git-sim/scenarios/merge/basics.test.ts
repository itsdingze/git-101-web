import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
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
    { write: { 'about.html': '<p>About</p>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add about page"' },
  ],
}

const CONFLICT_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': 'Welcome to our website!\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feature' },
    { write: { 'index.html': 'Welcome to our amazing website!\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Rewrite the welcome line"' },
    { run: 'git switch main' },
    { write: { 'index.html': 'Welcome back!\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Shorten the welcome line"' },
  ],
}

const INCOMING_FILE_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': 'Welcome to our website!\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feature' },
    {
      write: {
        'index.html': 'Welcome to our amazing website!\n',
        'banner.html': '<aside>Sale</aside>\n',
      },
    },
    { run: 'git add .' },
    { run: 'git commit -m "Rewrite the welcome line"' },
    { run: 'git switch main' },
    { write: { 'index.html': 'Welcome back!\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Shorten the welcome line"' },
  ],
}

const RESOLVED_LINE = 'Welcome back to our amazing website!'

async function conflicted(seed: SandboxSeed = CONFLICT_SEED): Promise<Sandbox> {
  const sandbox = await createSandbox(seed)
  await sandbox.run('git merge feature')
  return sandbox
}

async function resolve(sandbox: Sandbox): Promise<void> {
  await sandbox.run(`echo "${RESOLVED_LINE}" > index.html`)
  await sandbox.run('git add index.html')
  await sandbox.run('git commit -m "Merge branch feature"')
}

describe('git merge against a revision', () => {
  it('merges the abbreviated hash git log --oneline printed', async () => {
    const sandbox = await createSandbox(SEED)
    const listed = await textOf(sandbox, 'git log --oneline add-navbar')
    const tip = listed.split('\n')[0]?.split(' ')[0] ?? ''

    expect(await textOf(sandbox, `git merge ${tip}`)).toContain("Merge made by the 'ort' strategy.")
    expect(await textOf(sandbox, 'ls')).toBe('about.html  index.html  navbar.html')
  })

  it('merges a commit reached by a parent suffix', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git merge add-navbar~1')).toBe('Already up to date.')
  })

  it('still refuses a revision that does not exist', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git merge add-navbr')).toBe(
      'merge: add-navbr - not something we can merge',
    )
  })
})

describe('a conflicted merge', () => {
  it('reports the conflict and pauses the merge', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)

    expect(await textOf(sandbox, 'git merge feature')).toBe(
      [
        'Auto-merging index.html',
        'CONFLICT (content): Merge conflict in index.html',
        'Automatic merge failed; fix conflicts and then commit the result.',
      ].join('\n'),
    )
  })

  it('names the current side HEAD in the conflict markers', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'cat index.html')).toBe(
      [
        '<<<<<<< HEAD',
        'Welcome back!',
        '=======',
        'Welcome to our amazing website!',
        '>>>>>>> feature',
      ].join('\n'),
    )
  })

  it('reports the unmerged view instead of listing the file twice', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'You have unmerged paths.',
        '  (fix conflicts and run "git commit")',
        '  (use "git merge --abort" to abort the merge)',
        '',
        'Unmerged paths:',
        '  (use "git add <file>..." to mark resolution)',
        '\tboth modified:   index.html',
        '',
        'no changes added to commit (use "git add" and/or "git commit -a")',
      ].join('\n'),
    )
  })

  it('refuses to commit while a file is still unmerged', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git commit -m "Merge feature"')).toBe(
      [
        'error: Committing is not possible because you have unmerged files.',
        "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
        'hint: as appropriate to mark resolution and make a commit.',
        'fatal: Exiting because of an unresolved conflict.',
        'U\tindex.html',
      ].join('\n'),
    )
  })

  it('drops the file from the unmerged list once it is staged', async () => {
    const sandbox = await conflicted()
    await sandbox.run(`echo "${RESOLVED_LINE}" > index.html`)
    await sandbox.run('git add index.html')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'All conflicts fixed but you are still merging.',
        '  (use "git commit" to conclude merge)',
        '',
        'Changes to be committed:',
        '\tmodified:   index.html',
        '',
      ].join('\n'),
    )
  })
})

describe('a file only the merged-in branch has', () => {
  it('is staged rather than left untracked', async () => {
    const sandbox = await conflicted(INCOMING_FILE_SEED)
    const snapshot = await sandbox.snapshot()

    expect(snapshot.untracked).toEqual([])
    expect(snapshot.staged).toContainEqual({ path: 'banner.html', kind: 'new' })
  })

  it('reaches history when only the conflicted file is staged', async () => {
    const sandbox = await conflicted(INCOMING_FILE_SEED)
    await resolve(sandbox)

    const snapshot = await sandbox.snapshot()
    const merge = snapshot.commits.find((entry) => entry.message === 'Merge branch feature')

    expect(merge?.files).toEqual(['banner.html', 'index.html'])
  })
})

describe('finishing a conflicted merge', () => {
  it('prints only the summary line, like real git', async () => {
    const sandbox = await conflicted()
    await sandbox.run(`echo "${RESOLVED_LINE}" > index.html`)
    await sandbox.run('git add index.html')

    expect(await textOf(sandbox, 'git commit -m "Merge feature"')).toMatch(/^\[main [0-9a-f]{7}\] Merge feature$/)
  })

  it('accepts a resolution that keeps our side exactly', async () => {
    const sandbox = await conflicted()
    await sandbox.run('echo "Welcome back!" > index.html')
    await sandbox.run('git add index.html')

    expect(await textOf(sandbox, 'git commit -m "Keep our welcome"')).toMatch(/^\[main [0-9a-f]{7}\] Keep our welcome$/)
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
  })

  it('records the resolution as a commit with two parents', async () => {
    const sandbox = await conflicted()
    await resolve(sandbox)

    const snapshot = await sandbox.snapshot()
    const merge = snapshot.commits.find((entry) => entry.message === 'Merge branch feature')

    expect(merge?.parents).toHaveLength(2)
  })

  it('points to --no-edit when git commit is run without a message mid-merge', async () => {
    const sandbox = await conflicted()
    await sandbox.run(`echo "${RESOLVED_LINE}" > index.html`)
    await sandbox.run('git add index.html')

    expect(await textOf(sandbox, 'git commit')).toBe(
      [
        "This practice terminal has no text editor, so you can't type a message in one.",
        "To keep the message Git wrote for this merge, run: git commit --no-edit",
      ].join('\n'),
    )
  })

  it('leaves the merge concluded and the tree clean', async () => {
    const sandbox = await conflicted()
    await resolve(sandbox)

    expect(await textOf(sandbox, 'git status')).toBe(
      ['On branch main', 'nothing to commit, working tree clean'].join('\n'),
    )
  })

  it('lets git branch -d delete the branch it just merged', async () => {
    const sandbox = await conflicted()
    await resolve(sandbox)

    expect(await textOf(sandbox, 'git branch -d feature')).toMatch(
      /^Deleted branch feature \(was [0-9a-f]{7}\)\.$/,
    )
  })

  it('draws the join in the graph', async () => {
    const sandbox = await conflicted()
    await resolve(sandbox)

    expect(await textOf(sandbox, 'git log --oneline --graph')).toContain('|\\')
  })
})

describe('git merge --abort', () => {
  it('puts the working tree and the index back exactly as they were', async () => {
    const sandbox = await createSandbox(INCOMING_FILE_SEED)
    const before = await sandbox.snapshot()
    await sandbox.run('git merge feature')

    expect(await textOf(sandbox, 'git merge --abort')).toBe('')
    expect(await textOf(sandbox, 'cat index.html')).toBe('Welcome back!')
    expect(await textOf(sandbox, 'ls')).toBe('index.html')
    expect(await sandbox.snapshot()).toEqual({ ...before, lastCommand: 'ls' })
  })

  it('lets an ordinary commit follow the abort', async () => {
    const sandbox = await conflicted()
    await sandbox.run('git merge --abort')
    await sandbox.run('echo "Welcome home!" > index.html')
    await sandbox.run('git add index.html')
    await sandbox.run('git commit -m "Reword the welcome"')

    const snapshot = await sandbox.snapshot()
    const latest = snapshot.commits.find((entry) => entry.message === 'Reword the welcome')

    expect(latest?.parents).toHaveLength(1)
  })

  it('refuses when no merge is in progress', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)

    expect(await textOf(sandbox, 'git merge --abort')).toBe(
      'fatal: There is no merge to abort (MERGE_HEAD missing).',
    )
  })
})

const MERGED_BRANCH_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>Hello</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c fix-footer' },
    { write: { 'footer.html': '<footer></footer>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add footer"' },
    { run: 'git switch main' },
    { write: { 'index.html': '<h1>Hello!</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Fix the header"' },
    { run: 'git switch -c add-navbar' },
    { write: { 'navbar.html': '<nav></nav>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add navbar"' },
    { run: 'git merge fix-footer' },
    { run: 'git switch main' },
  ],
}

describe('git merge --no-ff', () => {
  async function branchAhead(): Promise<Sandbox> {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git merge add-navbar')
    await sandbox.run('git switch -c add-footer')
    await sandbox.run('echo "<footer></footer>" > footer.html')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add footer"')
    await sandbox.run('git switch main')
    return sandbox
  }

  it('makes a merge commit even when main could fast-forward', async () => {
    const sandbox = await branchAhead()

    const output = await textOf(sandbox, 'git merge --no-ff add-footer -m "Merge pull request #1 from team/add-footer"')

    expect(output).toContain("Merge made by the 'ort' strategy.")
    expect(output).not.toContain('Fast-forward')
    const [head] = (await sandbox.snapshot()).commits.filter((commit) => commit.message.startsWith('Merge pull request'))
    expect(head?.parents).toHaveLength(2)
  })
})

describe('fast-forwarding onto a branch that holds a merge commit', () => {
  it('slides the branch forward instead of refusing the shape', async () => {
    const sandbox = await createSandbox(MERGED_BRANCH_SEED)

    const output = await textOf(sandbox, 'git merge add-navbar')

    expect(output).toMatch(/^Updating [0-9a-f]{7}\.\.[0-9a-f]{7}\nFast-forward\n/)
    expect(output).toContain('footer.html')
    expect(await textOf(sandbox, 'ls')).toBe('footer.html  index.html  navbar.html')
    expect(await textOf(sandbox, 'git log --oneline -n 1')).toMatch(/\(HEAD -> main, add-navbar\) Merge branch 'fix-footer'/)
  })

  it('reports nothing to do when the branch is already contained', async () => {
    const sandbox = await createSandbox(MERGED_BRANCH_SEED)
    await sandbox.run('git switch add-navbar')

    expect(await textOf(sandbox, 'git merge main')).toBe('Already up to date.')
  })
})

describe('merging a branch that holds a merge commit after main moved on', () => {
  it('records a merge commit', async () => {
    const sandbox = await createSandbox(MERGED_BRANCH_SEED)
    await sandbox.run('echo "Hours: 9 to 5" > hours.txt')
    await sandbox.run('git add hours.txt')
    await sandbox.run('git commit -m "Add hours"')

    expect(await textOf(sandbox, 'git merge add-navbar')).toContain("Merge made by the 'ort' strategy.")
    expect(await textOf(sandbox, 'ls')).toBe('footer.html  hours.txt  index.html  navbar.html')
    expect(await textOf(sandbox, 'git log --oneline -n 1')).toMatch(/\(HEAD -> main\) Merge branch 'add-navbar'$/)
    expect(await textOf(sandbox, 'git branch -d add-navbar')).toMatch(/^Deleted branch add-navbar/)
  })

  it('labels a conflict with the incoming branch name', async () => {
    const sandbox = await createSandbox(MERGED_BRANCH_SEED)
    await sandbox.run('git switch add-navbar')
    await sandbox.run('echo "<nav>Home</nav>" > navbar.html')
    await sandbox.run('git commit -am "Name the home link"')
    await sandbox.run('git switch main')
    await sandbox.run('git merge fix-footer')
    await sandbox.run('echo "<nav>Start</nav>" > navbar.html')
    await sandbox.run('git add navbar.html')
    await sandbox.run('git commit -m "Add a start link"')

    expect(await textOf(sandbox, 'git merge add-navbar')).toContain('CONFLICT')
    expect(await textOf(sandbox, 'cat navbar.html')).toMatch(/>>>>>>> add-navbar$/)
  })
})

describe('a criss-cross merge', () => {
  it('merges like git does instead of giving up', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'story.md': 'story\n', 'notes.md': 'notes\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
        { run: 'git switch -c side' },
        { write: { 'story.md': 'story, side\n' } },
        { run: 'git commit -am "Side edit"' },
        { run: 'git switch main' },
        { write: { 'notes.md': 'notes, main\n' } },
        { run: 'git commit -am "Main edit"' },
        { run: 'git merge side' },
        { run: 'git switch side' },
        { run: 'git merge main~1' },
        { write: { 'side.md': 'more\n' } },
        { run: 'git add side.md' },
        { run: 'git commit -m "More on side"' },
        { run: 'git switch main' },
      ],
    })

    expect(await textOf(sandbox, 'git merge side')).toContain("Merge made by the 'ort' strategy.")
    expect(await textOf(sandbox, 'ls')).toBe('notes.md  side.md  story.md')
    expect(await textOf(sandbox, 'cat story.md')).toBe('story, side')
    expect(await textOf(sandbox, 'cat notes.md')).toBe('notes, main')
  })
})
