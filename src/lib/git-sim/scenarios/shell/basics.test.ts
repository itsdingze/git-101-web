import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [{ run: 'git init' }, { write: { 'notes.txt': 'hi\n', '.env': 'SECRET=1\n' } }],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('ls', () => {
  it('lists the current and parent folder first with -a, like a real shell', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'ls -a')).toBe('.  ..  .env  .git  notes.txt')
  })

  it('leaves them out with -A', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'ls -A')).toBe('.env  .git  notes.txt')
  })
})

describe('help', () => {
  it('points at the Start over button rather than a reset', async () => {
    const sandbox = await createSandbox(SEED)
    const help = await textOf(sandbox, 'help')

    expect(help).toContain('Start over')
    expect(help).not.toContain('reset button')
  })

  it('introduces itself as a practice terminal', async () => {
    const sandbox = await createSandbox(SEED)
    const help = await textOf(sandbox, 'help')

    expect(help.split('\n')[0]).toMatch(/^This is a practice terminal\./)
    expect(help).not.toContain('Anything else answers')
  })

  it('lists only the shell commands the course teaches, with what each one does', async () => {
    const sandbox = await createSandbox(SEED)
    const help = await textOf(sandbox, 'help')

    expect(help).toContain(
      [
        'Commands you know so far:',
        "  pwd       show which folder you're in",
        "  ls        list what's in this folder",
        '  cd        go into a folder, or back up with cd ..',
        "  cat       print what's in a file",
        '  echo      print text, or write it into a file with >',
      ].join('\n'),
    )
    expect(help).not.toMatch(/\b(mkdir|touch|mv|clear)\b/)
  })
})
