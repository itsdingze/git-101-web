import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const COOKBOOK: SandboxSeed = {
  dir: 'cookbook',
  setup: [
    { run: 'git init' },
    { write: { 'ragu.md': 'Ragu\n', 'desserts/tiramisu.md': 'Tiramisu\n' } },
    { run: 'git add ragu.md' },
  ],
}

async function statusLines(sandbox: Sandbox): Promise<string[]> {
  const result = await sandbox.run('git status')
  return result.outputs.flatMap((output) => output.text.split('\n')).filter((line) => line.startsWith('\t'))
}

describe('git status paths', () => {
  it('stay as they are at the top of the project, with an untracked folder shown once', async () => {
    const sandbox = await createSandbox(COOKBOOK)

    expect(await statusLines(sandbox)).toEqual(['\tnew file:   ragu.md', '\tdesserts/'])
  })

  it('are written relative to the folder you are standing in', async () => {
    const sandbox = await createSandbox(COOKBOOK)
    await sandbox.run('cd desserts')

    expect(await statusLines(sandbox)).toEqual(['\tnew file:   ../ragu.md', '\t./'])
  })

  it('list files one by one inside a folder Git already tracks part of', async () => {
    const sandbox = await createSandbox(COOKBOOK)
    await sandbox.run('git add desserts/tiramisu.md')
    await sandbox.run('echo "Pavlova" > desserts/pavlova.md')

    expect(await statusLines(sandbox)).toEqual([
      '\tnew file:   desserts/tiramisu.md',
      '\tnew file:   ragu.md',
      '\tdesserts/pavlova.md',
    ])
  })

  it('carry the folder name when the repository sits above you', async () => {
    const sandbox = await createSandbox({
      dir: 'my-story',
      setup: [{ write: { 'chapter-one.md': 'Chapter\n' } }],
    })
    await sandbox.run('cd ..')
    await sandbox.run('git init')

    expect(await statusLines(sandbox)).toEqual(['\tmy-story/'])
    await sandbox.run('cd my-story')
    expect(await statusLines(sandbox)).toEqual(['\t./'])
  })
})
