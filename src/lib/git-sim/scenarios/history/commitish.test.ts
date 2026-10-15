import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'style.css': 'body { margin: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add stylesheet"' },
  ],
}

async function abandonedHash(sandbox: Sandbox): Promise<string> {
  await sandbox.run('echo "console.log(1)" > app.js')
  await sandbox.run('git add app.js')
  await sandbox.run('git commit -m "Add new feature"')
  const [replaced] = await shortHashes(sandbox)

  await sandbox.run('echo "console.log(2)" > app.js')
  await sandbox.run('git add app.js')
  await sandbox.run('git commit --amend -m "Add a better feature"')
  return replaced ?? ''
}

function detachHint(hash: string): string {
  return [
    `fatal: checking out ${hash} would detach HEAD, which this course doesn't simulate.`,
    `hint: name the commit instead: git switch -c <new-branch> ${hash}`,
  ].join('\n')
}

async function shortHashes(sandbox: Sandbox): Promise<string[]> {
  const lines = (await textOf(sandbox, 'git log --oneline')).split('\n')
  return lines.map((line) => line.split(' ')[0] ?? '')
}

describe('abbreviated commit hashes', () => {
  it('resolves the seven-character hash git log prints, even for a commit an amend replaced', async () => {
    const sandbox = await createSandbox(SEED)
    const abandoned = await abandonedHash(sandbox)

    expect(await textOf(sandbox, `git switch -c recovered ${abandoned}`)).toBe(
      "Switched to a new branch 'recovered'",
    )
    expect(await textOf(sandbox, 'cat app.js')).toBe('console.log(1)')
  })

  it('accepts an abbreviated hash with a parent suffix', async () => {
    const sandbox = await createSandbox(SEED)
    const [newest] = await shortHashes(sandbox)

    await sandbox.run(`git switch -c older ${newest}~1`)
    expect(await textOf(sandbox, 'git log --oneline')).toBe(
      `${(await shortHashes(sandbox))[0]} (HEAD -> older) Initial commit`,
    )
  })

  it('reads ^N as the Nth parent of a merge and ^0 as the commit itself', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c side HEAD~1')
    await sandbox.run('echo "side" > side.txt')
    await sandbox.run('git add side.txt')
    await sandbox.run('git commit -m "Add side note"')
    await sandbox.run('git switch main')
    await sandbox.run('git merge side -m "Merge side"')

    expect(await textOf(sandbox, 'git log --oneline -1 HEAD^1')).toMatch(/ Add stylesheet$/)
    expect(await textOf(sandbox, 'git log --oneline -1 HEAD^2')).toMatch(/ Add side note$/)
    expect(await textOf(sandbox, 'git log --oneline -1 HEAD^0')).toMatch(/ Merge side$/)
  })

  it('refuses an unknown hash', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git switch -c nowhere abcdef1')).toBe(
      'fatal: invalid reference: abcdef1',
    )
  })

  it('explains that switching to a commit would detach HEAD', async () => {
    const sandbox = await createSandbox(SEED)
    const abandoned = await abandonedHash(sandbox)

    expect(await textOf(sandbox, `git switch ${abandoned}`)).toBe(detachHint(abandoned))
  })
})

describe('reflog positions', () => {
  it('branches at HEAD@{1}, the place HEAD stood before the last move', async () => {
    const sandbox = await createSandbox(SEED)
    await abandonedHash(sandbox)

    expect(await textOf(sandbox, 'git switch -c recovered HEAD@{1}')).toBe(
      "Switched to a new branch 'recovered'",
    )
    expect(await textOf(sandbox, 'cat app.js')).toBe('console.log(1)')
  })

  it('walks back from a reflog position with a parent suffix', async () => {
    const sandbox = await createSandbox(SEED)
    await abandonedHash(sandbox)

    await sandbox.run('git switch -c older HEAD@{1}~1')
    expect(await textOf(sandbox, 'git log --oneline -1')).toMatch(/^[0-9a-f]{7} \(HEAD -> older\) Add stylesheet$/)
  })

  it('refuses a position older than the reflog', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git show HEAD@{9}')).toBe("fatal: log for 'HEAD' only has 2 entries")
  })
})

describe('names that are neither a branch nor a file', () => {
  it('rejects git switch with the invalid reference error', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git switch nosuchbranch')).toBe(
      'fatal: invalid reference: nosuchbranch',
    )
  })
})

describe('bundled short flags', () => {
  it('expands a cluster into its separate flags', () => {
    expect(hasFlag(['-am'], '-a')).toBe(true)
    expect(flagValue(['-am', 'Tweak the copy'], '-m')).toBe('Tweak the copy')
  })

  it('leaves long flags, numeric values, and lone flags alone', () => {
    expect(hasFlag(['--amend'], '-a')).toBe(false)
    expect(hasFlag(['--all'], '-l')).toBe(false)
    expect(flagValue(['-n5'], '-n')).toBe('5')
    expect(flagValue(['--message=Hello'], '--message')).toBe('Hello')
    expect(operandsOf(['-am', 'Tweak'])).toEqual(['Tweak'])
  })

  it('stages and commits tracked changes with git commit -am', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "<h1>Renamed</h1>" > index.html')

    const output = await textOf(sandbox, 'git commit -am "Rename the heading"')
    expect(output).toMatch(/^\[main [0-9a-f]{7}\] Rename the heading$/m)
    expect(output).not.toContain(' Date: ')
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })
})

describe('git diff against a revision', () => {
  it('diffs the working tree against a named commit', async () => {
    const sandbox = await createSandbox(SEED)

    const patch = await textOf(sandbox, 'git diff HEAD~1')
    expect(patch).toContain('diff --git a/style.css b/style.css')
    expect(patch).toContain('+body { margin: 0; }')
  })

  it('diffs against a branch name', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c add-navbar')
    await sandbox.run('echo "<nav></nav>" > nav.html')
    await sandbox.run('git add nav.html')
    await sandbox.run('git commit -m "Add the navbar"')

    expect(await textOf(sandbox, 'git diff main')).toContain('diff --git a/nav.html b/nav.html')
  })

  it('diffs one commit against another', async () => {
    const sandbox = await createSandbox(SEED)
    const [newest, older] = await shortHashes(sandbox)

    expect(await textOf(sandbox, `git diff ${older} ${newest}`)).toContain(
      'diff --git a/style.css b/style.css',
    )
  })

  it('narrows a revision diff to the paths that follow it', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git diff HEAD~1 -- index.html')).toBe('')
    expect(await textOf(sandbox, 'git diff HEAD~1 -- style.css')).toContain('+body { margin: 0; }')
  })

  it('refuses an argument that is neither a revision nor a path', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git diff mian')).toBe(
      "fatal: ambiguous argument 'mian': unknown revision or path not in the working tree.",
    )
  })
})

describe('a commit message attached to -m', () => {
  it('does not stage unrelated work when the message begins with a letter git uses as a flag', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "<h1>Edited</h1>" > index.html')
    await sandbox.run('echo "body { color: red; }" > style.css')
    await sandbox.run('git add index.html')

    expect(await textOf(sandbox, 'git commit -m"add the header"')).toContain('add the header')

    const snapshot = await sandbox.snapshot()
    expect(snapshot.headMessage).toBe('add the header')
    expect(snapshot.unstaged.map((change) => change.path)).toEqual(['style.css'])
  })
})
