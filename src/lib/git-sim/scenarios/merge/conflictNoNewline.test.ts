import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

function seedWith(base: string): SandboxSeed {
  return {
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': base } },
      { run: 'git add .' },
      { run: 'git commit -q -m base' },
      { run: 'git switch -q -c other' },
    ],
  }
}

async function conflictBetween(ours: string, theirs: string, base = 'a\nbase\n'): Promise<Sandbox> {
  const sandbox = await createSandbox(seedWith(base))
  await sandbox.writeFile('f.txt', theirs)
  await sandbox.run('git commit -qam theirs')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', ours)
  await sandbox.run('git commit -qam ours')
  await sandbox.run('git merge other')
  return sandbox
}

describe('conflict markers when a side has no final newline', () => {
  it('sit on their own lines when both sides lack it', async () => {
    const sandbox = await conflictBetween('ours', 'theirs')

    expect(await sandbox.readFile('f.txt')).toBe('<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> other\n')
  })

  it('sit on their own lines when only theirs lacks it', async () => {
    const sandbox = await conflictBetween('a\nours\n', 'a\ntheirs')

    expect(await sandbox.readFile('f.txt')).toBe('a\n<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> other\n')
  })

  it('sit on their own lines when only ours lacks it', async () => {
    const sandbox = await conflictBetween('a\nours', 'a\ntheirs\n')

    expect(await sandbox.readFile('f.txt')).toBe('a\n<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> other\n')
  })

  it('leave ordinary conflicts alone', async () => {
    const sandbox = await conflictBetween('one\nours\ntail\n', 'one\ntheirs\ntail\n', 'one\nbase\ntail\n')

    expect(await sandbox.readFile('f.txt')).toBe('one\n<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> other\ntail\n')
  })
})

describe('the no-markers check', () => {
  it('still finds a marker glued to text after the first marker line is removed', async () => {
    const sandbox = await conflictBetween('ours', 'theirs')

    await sandbox.writeFile('f.txt', 'ours=======\ntheirs>>>>>>> other\n')

    expect((await sandbox.snapshot()).conflictMarkerFiles).toEqual(['f.txt'])
  })

  it('finds a glued opening marker', async () => {
    const sandbox = await conflictBetween('ours', 'theirs')

    await sandbox.writeFile('f.txt', 'text<<<<<<< HEAD\n')

    expect((await sandbox.snapshot()).conflictMarkerFiles).toEqual(['f.txt'])
  })

  it('passes a resolved file with long lines of equals signs', async () => {
    const sandbox = await conflictBetween('ours', 'theirs')

    await sandbox.writeFile('f.txt', 'title\n==========\n')

    expect((await sandbox.snapshot()).conflictMarkerFiles).toEqual([])
  })
})
