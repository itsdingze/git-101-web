import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { NO_LOCKS, type CommandLocks } from '@/lib/git-sim/input/commandLocks'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'todo-app',
  setup: [{ write: { 'app.txt': 'show(tasks)\n', 'notes/ideas.txt': 'search\n' } }],
}

const MOVE_AROUND_ONLY = 'This course uses the terminal only to move around with pwd, ls and cd, and to run Git and gh.'
const MOVE_AROUND_BEFORE_GH = 'This course uses the terminal only to move around with pwd, ls and cd, and to run Git.'

function learnerSandbox(seed: SandboxSeed = SEED, locks: CommandLocks = NO_LOCKS): Promise<Sandbox> {
  return createSandbox(seed, locks, 'navigation-only')
}

describe('a learner sandbox', () => {
  it.each(['echo hello', 'cat app.txt', 'mkdir docs', 'rm app.txt', 'touch todo.txt', 'mv app.txt main.txt'])(
    'turns away %s with one plain line on stderr',
    async (line) => {
      const sandbox = await learnerSandbox()

      const result = await sandbox.run(line)

      expect(result.outputs).toEqual([
        { stream: 'stderr', text: `${line.split(' ')[0]} isn't available here. ${MOVE_AROUND_ONLY}`, prose: true },
      ])
    },
  )

  it('leaves gh out of the refusal while gh is still locked', async () => {
    const sandbox = await learnerSandbox(SEED, new Map([['gh', 'Lesson 9']]))

    expect(await textOf(sandbox, 'cat app.txt')).toBe(`cat isn't available here. ${MOVE_AROUND_BEFORE_GH}`)
    expect(await textOf(sandbox, 'ls > listing.txt')).toBe(`Writing to a file with > isn't available here. ${MOVE_AROUND_BEFORE_GH}`)
  })

  it('leaves the files alone when it turns a command away', async () => {
    const sandbox = await learnerSandbox()
    await sandbox.run('rm app.txt')
    await sandbox.run('mkdir docs')
    await sandbox.run('echo hello > hello.txt')

    expect(await textOf(sandbox, 'ls')).toBe('app.txt  notes')
  })

  it('turns away writing output into a file, even from a command it allows', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'ls > listing.txt')).toBe(`Writing to a file with > isn't available here. ${MOVE_AROUND_ONLY}`)
    expect(await textOf(sandbox, 'ls')).toBe('app.txt  notes')
  })

  it('lets the learner move around and look', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'pwd')).toBe('/home/user/todo-app')
    expect(await textOf(sandbox, 'ls -a')).toContain('app.txt')
    await sandbox.run('cd notes')
    expect((await sandbox.prompt()).directory).toBe('~/todo-app/notes')
    await sandbox.run('cd ..')
    expect((await sandbox.prompt()).directory).toBe('~/todo-app')
  })

  it('lets the learner run help and clear', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'help')).toContain('pwd')
    expect((await sandbox.run('help')).outputs.every((output) => output.prose)).toBe(true)
    expect((await sandbox.run('clear')).clearScreen).toBe(true)
  })

  it('lets the learner run git', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'git init')).toMatch(/^Initialized empty Git repository/)
  })

  it('still lets the seed use any shell command', async () => {
    const sandbox = await learnerSandbox({ dir: 'todo-app', setup: [{ run: 'mkdir docs' }, { run: 'echo hi > docs/a.txt' }] })

    expect(await textOf(sandbox, 'ls docs')).toBe('a.txt')
  })

  it('stays locked after starting over', async () => {
    const sandbox = await learnerSandbox()
    await sandbox.reset()

    expect(await textOf(sandbox, 'cat app.txt')).toBe(`cat isn't available here. ${MOVE_AROUND_ONLY}`)
  })
})

describe('a sandbox for the simulator itself', () => {
  it('runs every shell command, as the simulator tests need', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'cat app.txt')).toBe('show(tasks)')
  })
})
