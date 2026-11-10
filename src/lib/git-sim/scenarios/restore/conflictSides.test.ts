import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'
const OURS = `${BASE}ours\n`
const THEIRS = `${BASE}theirs\n`
const MARKED = `${BASE}<<<<<<< ours\nours\n=======\ntheirs\n>>>>>>> theirs\n`

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m base' },
    { run: 'git switch -q -c other' },
  ],
}

async function conflicted(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('f.txt', THEIRS)
  await sandbox.run('git commit -qam theirs')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', OURS)
  await sandbox.run('git commit -qam ours')
  await sandbox.run('git merge other')
  return sandbox
}

async function deletedByThem(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git rm -q f.txt')
  await sandbox.run('git commit -qm theirs')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', OURS)
  await sandbox.run('git commit -qam ours')
  await sandbox.run('git merge other')
  return sandbox
}

describe('git restore during a conflict', () => {
  it('writes our side with --ours and stays unmerged', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git restore --ours f.txt')).toBe('')

    expect(await sandbox.readFile('f.txt')).toBe(OURS)
    expect(await textOf(sandbox, 'git status --short')).toBe('UU f.txt')
  })

  it('writes their side with --theirs and stays unmerged', async () => {
    const sandbox = await conflicted()

    await sandbox.run('git restore --theirs f.txt')

    expect(await sandbox.readFile('f.txt')).toBe(THEIRS)
    expect(await textOf(sandbox, 'git status --short')).toBe('UU f.txt')
  })

  it('recreates the markers with --merge', async () => {
    const sandbox = await conflicted()
    await sandbox.run('git restore --theirs f.txt')

    await sandbox.run('git restore --merge f.txt')

    expect(await sandbox.readFile('f.txt')).toBe(MARKED)
    expect(await textOf(sandbox, 'git status --short')).toBe('UU f.txt')
  })

  it('recreates the markers with -m', async () => {
    const sandbox = await conflicted()

    await sandbox.run('git restore -m f.txt')

    expect(await sandbox.readFile('f.txt')).toBe(MARKED)
  })

  it('still refuses a plain restore', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git restore f.txt')).toBe("error: path 'f.txt' is unmerged")
  })

  it('restores a settled path from the index with --ours', async () => {
    const sandbox = await conflicted()
    await sandbox.writeFile('g.txt', 'edited\n')

    expect(await textOf(sandbox, 'git restore --ours g.txt')).toBe('')

    expect(await sandbox.readFile('g.txt')).toBe('alpha\n')
  })

  it('writes the surviving side of a delete conflict', async () => {
    const sandbox = await deletedByThem()

    expect(await textOf(sandbox, 'git restore --ours f.txt')).toBe('')
    expect(await sandbox.readFile('f.txt')).toBe(OURS)
  })

  it('removes the file when the chosen side deleted it', async () => {
    const sandbox = await deletedByThem()

    expect(await textOf(sandbox, 'git restore --theirs f.txt')).toBe('')

    expect((await sandbox.snapshot()).workdirFiles).not.toContain('f.txt')
  })

  it('refuses --merge when a side is missing', async () => {
    const sandbox = await deletedByThem()

    expect(await textOf(sandbox, 'git restore --merge f.txt')).toBe("error: path 'f.txt' does not have all necessary versions")
  })

  it.each([
    ['git restore --ours -S f.txt', "fatal: '--ours' or '--theirs' cannot be used with --staged"],
    ['git restore --merge -S f.txt', "fatal: '--merge' or '--conflict' cannot be used with --staged"],
    ['git restore --ours --source=HEAD f.txt', "fatal: '--merge', '--ours', or '--theirs' cannot be used when checking out of a tree"],
    [
      'git restore -m --ours f.txt',
      'fatal: git checkout: --ours/--theirs, --force and --merge are incompatible when\nchecking out of the index.',
    ],
  ])('refuses %s', async (line, message) => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, line)).toBe(message)
  })
})
