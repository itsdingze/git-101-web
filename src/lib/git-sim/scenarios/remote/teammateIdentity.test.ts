import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SHARED_SEED: SandboxSeed = {
  dir: 'project',
  identity: { name: 'Ada Lovelace', email: 'ada@example.com' },
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [
      { write: { 'README.md': '# Project\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
    ahead: [
      { write: { 'guide.md': '# Guide\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Add the guide"' },
    ],
  },
}

async function authorLines(sandbox: Awaited<ReturnType<typeof createSandbox>>, ref: string): Promise<string> {
  const result = await sandbox.run(`git log ${ref}`)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('work a teammate pushed while you were away', () => {
  it('is signed by the teammate, while your own commits keep your name', async () => {
    const sandbox = await createSandbox(SHARED_SEED)
    await sandbox.run('git pull')
    await sandbox.run('echo "hi" > notes.md')
    await sandbox.run('git add notes.md')
    await sandbox.run('git commit -m "Add notes"')

    const log = await authorLines(sandbox, '')
    expect(log).toMatch(/Author: Sam Rivera <sam@example.com>\n[\s\S]*Add the guide/)
    expect(log).toMatch(/Author: Ada Lovelace <ada@example.com>\n[\s\S]*Add notes/)
  })
})
