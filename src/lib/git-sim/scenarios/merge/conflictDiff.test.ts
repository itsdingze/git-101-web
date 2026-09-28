import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

async function conflictedStory(): Promise<Sandbox> {
  const sandbox = await playedFrom(['git init'])
  await sandbox.run('echo one > story.md')
  await sandbox.run('echo two >> story.md')
  await sandbox.run('echo three >> story.md')
  await sandbox.run('echo keep > other.md')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m base')
  await sandbox.run('git switch -c feature')
  await sandbox.run('echo one > story.md')
  await sandbox.run('echo feat >> story.md')
  await sandbox.run('echo three >> story.md')
  await sandbox.run('git commit -am feat')
  await sandbox.run('git switch main')
  await sandbox.run('echo one > story.md')
  await sandbox.run('echo main >> story.md')
  await sandbox.run('echo three >> story.md')
  await sandbox.run('echo edited > other.md')
  await sandbox.run('git commit -am main')
  await sandbox.run('git merge feature')
  return sandbox
}

describe('git diff during a merge conflict, matched to git 2.51', () => {
  it('shows a combined diff of both sides with the markers', async () => {
    const sandbox = await conflictedStory()

    expect(await textOf(sandbox, 'git diff')).toBe(
      [
        'diff --cc story.md',
        'index cba1f6a,233db59..0000000',
        '--- a/story.md',
        '+++ b/story.md',
        '@@@ -1,3 -1,3 +1,7 @@@',
        '  one',
        '++<<<<<<< HEAD',
        ' +main',
        '++=======',
        '+ feat',
        '++>>>>>>> feature',
        '  three',
      ].join('\n'),
    )
  })

  it('shows only the header once the file simply takes one side', async () => {
    const sandbox = await conflictedStory()
    await sandbox.run('echo one > story.md')
    await sandbox.run('echo feat >> story.md')
    await sandbox.run('echo three >> story.md')

    expect(await textOf(sandbox, 'git diff')).toBe(
      ['diff --cc story.md', 'index cba1f6a,233db59..0000000', '--- a/story.md', '+++ b/story.md'].join('\n'),
    )
  })

  it('names a modify/delete conflict as an unmerged path', async () => {
    const sandbox = await playedFrom(['git init'])
    for (const line of [
      'echo one > old.md',
      'echo x > other.md',
      'git add .',
      'git commit -m base',
      'git switch -c feature',
      'git rm -q old.md',
      'git commit -m del',
      'git switch main',
      'echo two > old.md',
      'git commit -am edit',
      'git merge feature',
    ]) {
      await sandbox.run(line)
    }

    expect(await textOf(sandbox, 'git diff')).toBe('* Unmerged path old.md')
  })
})
