import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = { dir: 'project', setup: [{ write: { 'notes.txt': 'hi\n' } }] }

const PIPES = "Pipes (|) aren't available in this practice terminal. Run each command on its own line."

describe('a pipe', () => {
  it('stops the whole line and says pipes are not available', async () => {
    const sandbox = await createSandbox(SEED)
    const result = await sandbox.run('mkdir made && ls | cat')

    expect(result.outputs).toEqual([{ text: PIPES, stream: 'stderr', prose: true }])
    expect(await textOf(sandbox, 'ls')).toBe('notes.txt')
  })

  it('at the end of the line also says pipes are not available', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'ls |')).toBe(PIPES)
  })

  it.each([
    ['echo "a | b"', 'a | b'],
    ["echo 'a | b'", 'a | b'],
    ['echo a\\|b', 'a|b'],
  ])('inside quotes or escaped stays text in %j', async (line, printed) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(printed)
  })
})

describe('a variable', () => {
  it.each([
    ['echo $HOME', '$HOME'],
    ['echo ${HOME}', '${HOME}'],
    ['git commit -m "Saved in $PWD"', '$PWD'],
    ['mkdir made && echo $USER', '$USER'],
  ])('stops %j and names the variable', async (line, name) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(`Variables like ${name} aren't available in this practice terminal.`)
    expect(await textOf(sandbox, 'ls')).toBe('notes.txt')
  })

  it.each([
    ["echo '$HOME'", '$HOME'],
    ['echo \\$HOME', '$HOME'],
    ['echo "\\$HOME"', '$HOME'],
    ['echo costs $ 5', 'costs $ 5'],
  ])('stays text in %j', async (line, printed) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(printed)
  })
})

describe('a command inside a command', () => {
  it.each(['echo $(pwd)', 'echo "in $(pwd)"'])('stops %j for $(...)', async (line) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(
      "Running a command inside another with $(...) isn't available in this practice terminal. Run each command on its own line.",
    )
  })

  it('stops a message with backticks in double quotes', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git commit -m "Fix `ls`"')).toBe(
      "Backticks (`) run a command inside another in a real terminal, and this practice terminal doesn't do that. To type a backtick as text, put it inside single quotes.",
    )
  })

  it('keeps backticks in single quotes as text', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, "echo 'Fix `ls`'")).toBe('Fix `ls`')
  })
})

describe('redirection next to unsupported syntax', () => {
  it('still writes a file when the line has none', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run("echo 'a | $HOME' > out.txt")

    expect(await sandbox.readFile('out.txt')).toBe('a | $HOME\n')
  })
})
