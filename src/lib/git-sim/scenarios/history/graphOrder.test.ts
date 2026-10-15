import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

const START = ['git init', 'echo 1 > a', 'git add .', 'git commit -m c1']

const SCENARIOS: Record<string, readonly string[]> = {
  mergeOfOlderMain: [
    ...START,
    'git branch f',
    'echo 2 > a',
    'git commit -am m1',
    'echo 3 > a',
    'git commit -am m2',
    'git switch f',
    'echo 1 > f',
    'git add .',
    'git commit -m f1',
    'echo 2 > f',
    'git commit -am f2',
    'git switch main',
    'git merge f',
  ],
  unmerged: [
    ...START,
    'git switch -c f',
    'echo 1 > f',
    'git add .',
    'git commit -m f1',
    'git switch main',
    'echo 2 > a',
    'git commit -am m1',
    'git switch f',
    'echo 2 > f',
    'git commit -am f2',
    'git switch main',
    'echo 3 > a',
    'git commit -am m2',
  ],
  threeTips: [
    ...START,
    'git branch b',
    'echo 2 > a',
    'git commit -am c2',
    'git switch -c x',
    'echo 1 > x',
    'git add .',
    'git commit -m x1',
    'git switch b',
    'echo 1 > b',
    'git add .',
    'git commit -m b1',
    'git switch main',
    'echo 3 > a',
    'git commit -am c3',
  ],
  mainIntoFeature: [
    ...START,
    'git switch -c f',
    'echo 1 > f',
    'git add .',
    'git commit -m f1',
    'git switch main',
    'echo 2 > a',
    'git commit -am m1',
    'git switch f',
    'git merge main',
    'echo 2 > f',
    'git commit -am f2',
    'git switch main',
    'git merge f',
  ],
  repeatMerge: [
    ...START,
    'git switch -c f',
    'echo 1 > f',
    'git add .',
    'git commit -m f1',
    'git switch main',
    'echo 2 > a',
    'git commit -am m1',
    'git merge f',
    'git switch f',
    'echo 2 > f',
    'git commit -am f2',
    'git switch main',
    'echo 3 > a',
    'git commit -am m2',
    'git merge f',
  ],
  mergeThenUnmerged: [
    ...START,
    'git switch -c x',
    'echo 1 > x',
    'git add .',
    'git commit -m x1',
    'git switch main',
    'git switch -c y',
    'echo 1 > y',
    'git add .',
    'git commit -m y1',
    'git switch main',
    'echo 2 > a',
    'git commit -am m1',
    'git merge x',
    'echo 3 > a',
    'git commit -am m2',
    'git switch y',
    'echo 2 > y',
    'git commit -am y2',
    'git switch main',
  ],
}

async function played(name: string): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of SCENARIOS[name] ?? []) await sandbox.run(line)
  return sandbox
}

async function shapeOf(sandbox: Sandbox, line: string): Promise<string[]> {
  const result = await sandbox.run(line)
  return result.outputs
    .map((output) => output.text)
    .join('\n')
    .split('\n')
    .map((row) => row.replace(/[0-9a-f]{7}/g, 'x'))
}

describe('git log --graph orders commits like real git 2.51', () => {
  it('draws the merged side branch before the older main line', async () => {
    expect(await shapeOf(await played('mergeOfOlderMain'), 'git log --oneline --graph --all')).toEqual([
      "*   x (HEAD -> main) Merge branch 'f'",
      '|\\',
      '| * x (f) f2',
      '| * x f1',
      '* | x m2',
      '* | x m1',
      '|/',
      '* x c1',
    ])
  })

  it('finishes the newest tip before starting an unmerged branch', async () => {
    expect(await shapeOf(await played('unmerged'), 'git log --oneline --graph --all')).toEqual([
      '* x (HEAD -> main) m2',
      '* x m1',
      '| * x (f) f2',
      '| * x f1',
      '|/',
      '* x c1',
    ])
  })

  it('stacks three unmerged tips newest first', async () => {
    expect(await shapeOf(await played('threeTips'), 'git log --oneline --graph --all')).toEqual([
      '* x (HEAD -> main) c3',
      '| * x (b) b1',
      '| | * x (x) x1',
      '| |/',
      '|/|',
      '* | x c2',
      '|/',
      '* x c1',
    ])
  })

  it('draws main merged into a feature branch', async () => {
    expect(await shapeOf(await played('mainIntoFeature'), 'git log --oneline --graph --all')).toEqual([
      '* x (HEAD -> main, f) f2',
      "*   x Merge branch 'main' into f",
      '|\\',
      '| * x m1',
      '* | x f1',
      '|/',
      '* x c1',
    ])
  })

  it('draws a branch merged twice', async () => {
    expect(await shapeOf(await played('repeatMerge'), 'git log --oneline --graph --all')).toEqual([
      "*   x (HEAD -> main) Merge branch 'f'",
      '|\\',
      '| * x (f) f2',
      '* | x m2',
      "* | x Merge branch 'f'",
      '|\\|',
      '| * x f1',
      '* | x m1',
      '|/',
      '* x c1',
    ])
  })

  it('starts with the newest tip even when it is not HEAD', async () => {
    expect(await shapeOf(await played('mergeThenUnmerged'), 'git log --oneline --graph --all')).toEqual([
      '* x (y) y2',
      '* x y1',
      '| * x (HEAD -> main) m2',
      "| *   x Merge branch 'x'",
      '| |\\',
      '| | * x (x) x1',
      '| |/',
      '|/|',
      '| * x m1',
      '|/',
      '* x c1',
    ])
  })

  it('limits the number of commits after ordering them', async () => {
    expect(await shapeOf(await played('mergeOfOlderMain'), 'git log --oneline --graph -3')).toEqual([
      "*   x (HEAD -> main) Merge branch 'f'",
      '|\\',
      '| * x (f) f2',
      '| * x f1',
    ])
    expect(await shapeOf(await played('mergeOfOlderMain'), 'git log --oneline -3')).toEqual([
      "x (HEAD -> main) Merge branch 'f'",
      'x (f) f2',
      'x f1',
    ])
  })
})
