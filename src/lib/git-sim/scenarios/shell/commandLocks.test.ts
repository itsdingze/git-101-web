import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { CommandLocks } from '@/lib/git-sim/input/commandLocks'
import { GIT_COMMANDS } from '@/lib/git-sim/commands/git/registry'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

const LOCKS: CommandLocks = new Map([
  ['stash', 'Lesson 8: Stashing'],
  ['push', 'Lesson 10: Remotes & GitHub'],
])

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('a locked git command', () => {
  it('names the lesson that unlocks it and leaves the repository alone', async () => {
    const sandbox = await createSandbox(SEED, LOCKS)
    await sandbox.run('echo "<h1>Edited</h1>" > index.html')

    const result = await sandbox.run('git stash')

    expect(result.outputs).toHaveLength(1)
    expect(result.outputs[0]?.stream).toBe('stderr')
    expect(result.outputs[0]?.text.split('\n')[0]).toBe('git stash is taught in Lesson 8: Stashing.')
    expect(await textOf(sandbox, 'cat index.html')).toBe('<h1>Edited</h1>')
  })

  it('lists the commands the learner can use instead, in help order', async () => {
    const onlyStatusAndInit: CommandLocks = new Map(
      Object.keys(GIT_COMMANDS)
        .filter((name) => name !== 'status' && name !== 'init')
        .map((name) => [name, 'a later lesson']),
    )
    const sandbox = await createSandbox(SEED, onlyStatusAndInit)

    expect(await textOf(sandbox, 'git add .')).toBe(
      'git add is taught in a later lesson.\nAvailable now: init, status',
    )
  })
})

describe('locks and seeding', () => {
  it('let a seed run commands the learner has not unlocked', async () => {
    const everythingLocked: CommandLocks = new Map(
      Object.keys(GIT_COMMANDS).map((name) => [name, 'a later lesson']),
    )

    const sandbox = await createSandbox(SEED, everythingLocked)

    expect((await sandbox.snapshot()).commits).toHaveLength(1)
  })

  it('still apply after a reset', async () => {
    const sandbox = await createSandbox(SEED, LOCKS)
    await sandbox.reset()

    expect(await textOf(sandbox, 'git stash')).toMatch(/^git stash is taught in Lesson 8: Stashing\./)
  })
})

describe('git help with locks', () => {
  it('lists only the unlocked commands and says more are coming', async () => {
    const sandbox = await createSandbox(SEED, LOCKS)

    const help = await textOf(sandbox, 'git help')

    expect(help).toContain('These are the Git commands available so far:')
    expect(help).toContain('      commit     record changes to the repository')
    expect(help).not.toMatch(/^\s+stash\s/m)
    expect(help).not.toMatch(/^\s+push\s/m)
    expect(help.endsWith('Later lessons add more commands.')).toBe(true)
  })

  it('keeps the full list when nothing is locked', async () => {
    const sandbox = await createSandbox(SEED)

    const help = await textOf(sandbox, 'git help')

    expect(help).toContain('These are the Git commands this practice sandbox understands:')
    expect(help).toMatch(/^\s+stash\s/m)
    expect(help).not.toContain('Later lessons add more commands.')
  })
})

describe('the sandbox help command with locks', () => {
  it('lists only the git commands unlocked so far, with what each does, and says more are coming', async () => {
    const sandbox = await createSandbox(SEED, LOCKS)

    const help = await textOf(sandbox, 'help')

    expect(help).toContain('Git commands you know so far:')
    expect(help).toContain('  commit    record changes to the repository')
    expect(help).not.toMatch(/\bstash\b/)
    expect(help).not.toMatch(/\bpush\b/)
    expect(help).toContain('Later lessons add more commands.')
  })

  it('lists every git command when nothing is locked', async () => {
    const sandbox = await createSandbox(SEED)

    const help = await textOf(sandbox, 'help')

    expect(help).toContain('Git commands you know:')
    expect(help).toMatch(/\bstash\b/)
    expect(help).not.toContain('Later lessons add more commands.')
  })

  it('says there are no git commands yet, rather than an empty list, when every one is locked', async () => {
    const everythingLocked: CommandLocks = new Map(
      Object.keys(GIT_COMMANDS).map((name) => [name, 'a later lesson']),
    )
    const sandbox = await createSandbox(SEED, everythingLocked)

    const help = await textOf(sandbox, 'help')

    expect(help).toContain('No Git commands yet. Later lessons teach them.')
    expect(help).not.toContain('Git commands you know')
  })
})
