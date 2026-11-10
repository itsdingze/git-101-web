import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [{ write: { 'f.txt': 'one\ntwo\nthree\n' } }, { run: 'git add .' }, { run: 'git commit -q -m "Initial commit"' }],
  },
}

function mismatch(upstream: string): string {
  return [
    'fatal: The upstream branch of your current branch does not match',
    'the name of your current branch.  To push to the upstream branch',
    'on the remote, use',
    '',
    `    git push origin HEAD:${upstream}`,
    '',
    'To push to the branch of the same name on the remote, use',
    '',
    '    git push origin HEAD',
    '',
    "To choose either option permanently, see push.default in 'git help config'.",
    '',
    'To avoid automatically configuring an upstream branch when its name',
    "won't match the local branch, see option 'simple' of branch.autoSetupMerge",
    "in 'git help config'.",
    '',
  ].join('\n')
}

describe('git push when the upstream name differs', () => {
  it('refuses after a rename', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c x')
    await sandbox.run('git push -q -u origin x')
    await sandbox.run('git branch -m renamed')

    expect(await textOf(sandbox, 'git push')).toBe(mismatch('x'))
    expect(await textOf(sandbox, 'git push origin')).toBe(mismatch('x'))
  })

  it('refuses after pushing under another name', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c y')
    await sandbox.run('git push -u origin HEAD:other')

    expect(await textOf(sandbox, 'git push')).toBe(mismatch('other'))
  })

  it('still pushes a matching upstream', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git push')).toBe('Everything up-to-date')
  })
})
