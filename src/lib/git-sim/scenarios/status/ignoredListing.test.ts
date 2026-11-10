import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n', '.gitignore': 'node_modules/\n*.log\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m ig' },
    {
      write: {
        'node_modules/lp/index.js': 'p\n',
        'logs/a.log': 'l\n',
        'mix/b.log': 'l\n',
        'mix/keep.txt': 'k\n',
        'top.log': 'x\n',
        'deep/er/z.log': 'z\n',
      },
    },
  ],
}

function ignoredRows(text: string): string[] {
  return text.split('\n').filter((line) => line.startsWith('!!'))
}

describe('git status --ignored', () => {
  it('collapses a folder holding only ignored files', async () => {
    const sandbox = await createSandbox(SEED)

    expect(ignoredRows(await textOf(sandbox, 'git status --short --ignored'))).toEqual([
      '!! deep/',
      '!! logs/',
      '!! mix/b.log',
      '!! node_modules/',
      '!! top.log',
    ])
  })

  it('lists files with -uall', async () => {
    const sandbox = await createSandbox(SEED)

    expect(ignoredRows(await textOf(sandbox, 'git status --short --ignored -uall'))).toEqual([
      '!! deep/er/z.log',
      '!! logs/a.log',
      '!! mix/b.log',
      '!! node_modules/lp/index.js',
      '!! top.log',
    ])
  })

  it('lists nothing with -uno', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git status --short --ignored -uno')).toBe('')
  })
})
