import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { NO_LOCKS } from '@/lib/git-sim/input/commandLocks'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ run: 'git init' }, { write: { 'notes.txt': 'hi\n', 'sub/inner.txt': 'in\n' } }],
}

describe('commands joined with &&', () => {
  it('runs the second after the first succeeds', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add . && git commit -m "x"')

    expect(await textOf(sandbox, 'git log --oneline')).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) x$/)
  })

  it('runs the second in the folder the first moved to', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'cd sub && ls')).toBe('inner.txt')
  })

  it('stops after a command that fails', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'cat missing.txt && echo after')).toBe('cat: missing.txt: No such file or directory')
  })
})

describe('commands joined with ||', () => {
  it('runs the second after the first fails', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'cat missing.txt || echo instead')).toBe(
      'cat: missing.txt: No such file or directory\ninstead',
    )
  })

  it('skips the second after the first succeeds', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo first || echo second')).toBe('first')
  })

  it('carries the last result past a skipped command, like bash', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo first || echo skipped && echo after')).toBe('first\nafter')
  })
})

describe('commands joined with ;', () => {
  it('runs the second whatever the first did', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'cat missing.txt; echo after')).toBe('cat: missing.txt: No such file or directory\nafter')
  })

  it('allows a ; at the end of the line', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo hi ;')).toBe('hi')
  })
})

describe('list operators inside quotes', () => {
  it.each([
    ['echo "a && b"', 'a && b'],
    ["echo 'a || b'", 'a || b'],
    ['echo a\\;b', 'a;b'],
  ])('stay part of the text in %j', async (line, printed) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(printed)
  })
})

describe('a list with a command missing', () => {
  it.each([
    ['&& ls', '&&'],
    ['; ls', ';'],
    ['ls ;; ls', ';;'],
    ['ls ; ;', ';'],
    ['ls && || ls', '||'],
    ['echo a > && ls', '&&'],
  ])('is a syntax error for %j, and nothing runs', async (line, token) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(`bash: syntax error near unexpected token \`${token}'`)
  })

  it.each(['&&', '||'])('explains that a real terminal waits for more after a final %s', async (operator) => {
    const sandbox = await createSandbox(SEED)
    const result = await sandbox.run(`echo a > made.txt ${operator}`)

    expect(result.outputs).toEqual([
      {
        text: `A ${operator} at the end of a line tells a real terminal to wait for more. This practice terminal runs one line at a time, so put the next command on the same line.`,
        stream: 'stderr',
        prose: true,
      },
    ])
    expect(await textOf(sandbox, 'ls')).toBe('notes.txt  sub')
  })
})

describe('limits inside a list', () => {
  it('turns away a locked git command and stops the && after it', async () => {
    const sandbox = await createSandbox(SEED, new Map([['commit', 'Your First Commit']]))
    const result = await sandbox.run('git add . && git commit -m "x" && echo after')

    expect(result.outputs).toHaveLength(1)
    expect(result.outputs[0]?.text.split('\n')[0]).toBe('git commit is taught in Your First Commit.')
  })

  it('turns away a shell command a learner sandbox does not allow, and runs the rest', async () => {
    const sandbox = await createSandbox(SEED, NO_LOCKS, 'navigation-only')
    const result = await sandbox.run('cd sub && echo hi; pwd')

    expect(result.outputs.map((output) => output.stream)).toEqual(['stderr', 'stdout'])
    expect(result.outputs[1]?.text).toBe('/home/user/project/sub')
  })
})

describe('clear inside a list', () => {
  it('clears the screen and keeps what the later commands print', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await sandbox.run('echo before && clear && echo after')).toEqual({
      outputs: [{ text: 'after', stream: 'stdout' }],
      clearScreen: true,
    })
  })
})

describe('redirection inside a list', () => {
  it('applies to its own command only', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo saved > out.txt && cat out.txt')).toBe('saved')
  })
})
