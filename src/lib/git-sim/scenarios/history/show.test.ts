import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'todo-app',
  setup: [
    { run: 'git init' },
    { write: { 'settings.txt': 'MAX_TASKS = 10\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "feat: add settings"' },
    { write: { 'settings.txt': 'MAX_TASKS = 20\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "feat: raise the task limit"' },
  ],
}

async function linesOf(sandbox: Sandbox, line: string): Promise<string[]> {
  const result = await sandbox.run(line)
  return result.outputs.flatMap((output) => output.text.split('\n'))
}

describe('git show', () => {
  it('prints the newest commit, then the lines it changed', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await linesOf(sandbox, 'git show')).toEqual([
      expect.stringMatching(/^commit [0-9a-f]{40} \(HEAD -> main\)$/),
      'Author: Your Name <you@example.com>',
      expect.stringMatching(/^Date: {3}\S/),
      '',
      '    feat: raise the task limit',
      '',
      'diff --git a/settings.txt b/settings.txt',
      expect.stringMatching(/^index [0-9a-f]{7}\.\.[0-9a-f]{7} 100644$/),
      '--- a/settings.txt',
      '+++ b/settings.txt',
      '@@ -1 +1 @@',
      '-MAX_TASKS = 10',
      '+MAX_TASKS = 20',
    ])
  })

  it('shows the commit you name, with a first commit adding every line', async () => {
    const sandbox = await createSandbox(SEED)

    expect((await linesOf(sandbox, 'git show HEAD~1')).slice(4)).toEqual([
      '    feat: add settings',
      '',
      'diff --git a/settings.txt b/settings.txt',
      'new file mode 100644',
      expect.stringMatching(/^index 0000000\.\.[0-9a-f]{7}$/),
      '--- /dev/null',
      '+++ b/settings.txt',
      '@@ -0,0 +1 @@',
      '+MAX_TASKS = 10',
    ])
  })

  it('fails like git on a commit that does not exist', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await linesOf(sandbox, 'git show nope')).toEqual([
      "fatal: ambiguous argument 'nope': unknown revision or path not in the working tree.",
    ])
  })

  it('fails like git before the first commit', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', setup: [{ run: 'git init' }] })

    expect(await linesOf(sandbox, 'git show')).toEqual([
      "fatal: your current branch 'main' does not have any commits yet",
    ])
  })

  it('prints a merge commit without a diff', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c add-due-dates HEAD~1')
    await sandbox.run('echo "due = today() + 7" > dates.txt')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "feat: add due dates"')
    await sandbox.run('git switch main')
    await sandbox.run('git merge add-due-dates')

    const lines = await linesOf(sandbox, 'git show')

    expect(lines[1]).toMatch(/^Merge: [0-9a-f]{7} [0-9a-f]{7}$/)
    expect(lines.slice(4)).toEqual(['', "    Merge branch 'add-due-dates'"])
  })
})
