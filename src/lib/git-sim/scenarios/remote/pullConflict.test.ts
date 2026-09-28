import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [{ write: { 'h.md': 'x\n' } }, { run: 'git add .' }, { run: 'git commit -m "Initial commit"' }],
    ahead: [{ write: { 'h.md': 'upstream\n' } }, { run: 'git commit -am "Upstream line"' }],
  },
  setup: [
    { run: 'git config pull.rebase false' },
    { write: { 'h.md': 'local\n' } },
    { run: 'git commit -am "Local line"' },
  ],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function remoteTip(sandbox: Sandbox): Promise<string> {
  const log = await textOf(sandbox, 'git log origin/main -n 1')
  return /^commit ([0-9a-f]{40})/.exec(log)?.[1] ?? ''
}

describe('a conflicted pull', () => {
  it('labels the incoming side of the markers with the full commit hash, like real git', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git pull')

    expect(await textOf(sandbox, 'cat h.md')).toBe(
      ['<<<<<<< HEAD', 'local', '=======', 'upstream', `>>>>>>> ${await remoteTip(sandbox)}`].join('\n'),
    )
  })

  it('refuses a second pull while the conflict is unresolved', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git pull')

    expect(await textOf(sandbox, 'git pull')).toBe(
      [
        'error: Pulling is not possible because you have unmerged files.',
        "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
        'hint: as appropriate to mark resolution and make a commit.',
        'fatal: Exiting because of an unresolved conflict.',
      ].join('\n'),
    )
  })

  it('refuses a second pull once resolved but not committed', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git pull')
    await sandbox.run('echo "fixed" > h.md')
    await sandbox.run('git add h.md')

    expect(await textOf(sandbox, 'git pull')).toBe(
      [
        'error: You have not concluded your merge (MERGE_HEAD exists).',
        'hint: Please, commit your changes before merging.',
        'fatal: Exiting because of unfinished merge.',
      ].join('\n'),
    )
  })
})

describe('merging a revision that is not a branch name', () => {
  it('labels the markers with the revision as typed', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 's.md': 'one\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
        { run: 'git switch -c feature' },
        { write: { 's.md': 'feature\n' } },
        { run: 'git commit -am "Feature"' },
        { run: 'git switch main' },
        { write: { 's.md': 'main\n' } },
        { run: 'git commit -am "Main"' },
      ],
    })
    await sandbox.run('git merge feature~0')

    expect(await textOf(sandbox, 'cat s.md')).toBe(
      ['<<<<<<< HEAD', 'main', '=======', 'feature', '>>>>>>> feature~0'].join('\n'),
    )
  })
})
