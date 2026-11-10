import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function withRemoteBranch(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    remote: {
      name: 'origin',
      url: 'https://github.com/team/project.git',
      setup: [{ write: { 'f.txt': 'one\ntwo\nthree\n' } }, { run: 'git add .' }, { run: 'git commit -q -m "Initial commit"' }],
    },
  })
  await sandbox.run('git switch -c a')
  await sandbox.run('git push origin a')
  await sandbox.run('git switch main')
  return sandbox
}

describe('git branch -dr', () => {
  it.each(['git branch -dr origin/a', 'git branch -d -r origin/a', 'git branch -Dr origin/a'])('%s deletes the tracking ref', async (line) => {
    const sandbox = await withRemoteBranch()

    expect(await textOf(sandbox, line)).toMatch(/^Deleted remote-tracking branch origin\/a \(was [0-9a-f]{7}\)\.$/)
    expect(await textOf(sandbox, 'git branch -r')).not.toContain('origin/a')
  })

  it('reports a missing tracking ref', async () => {
    const sandbox = await withRemoteBranch()

    const result = await sandbox.run('git branch -dr origin/nope')

    expect(result.outputs.some((output) => output.stream === 'stderr')).toBe(true)
    expect(result.outputs.map((output) => output.text).join('\n')).toBe("error: remote-tracking branch 'origin/nope' not found")
  })
})
