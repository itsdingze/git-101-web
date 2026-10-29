import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const LONG_CLASS =
  'class Very_long_name_that_goes_on_and_on_and_on_and_on_and_on_and_on_and_on_and_on_and_on_more:   '

function appPy(message: string, last: string): string {
  return [
    'import sys',
    '',
    'def load() -> list:',
    '    return []',
    '',
    '',
    'def show_search() -> None:  ',
    '    query = input()',
    '    for item in load():',
    '        print(item)',
    `    print("${message}")`,
    '    return',
    '',
    '',
    '',
    '',
    '',
    '',
    LONG_CLASS,
    '    a = 1',
    '    b = 2',
    '    c = 3',
    '    d = 4',
    `    e = ${last}`,
    '',
  ].join('\n')
}

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'app.py': appPy('done', '5'), 'top.txt': 'first\nsecond\nthird\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'app.py': appPy('found', '50'), 'top.txt': 'first\nsecond!\nthird\n' } },
  ],
}

describe('hunk headers', () => {
  it('name the nearest line above the hunk that starts with a letter, _ or $', async () => {
    const sandbox = await createSandbox(SEED)
    const hunkHeaders = (await textOf(sandbox, 'git diff'))
      .split('\n')
      .filter((line) => line.startsWith('@@'))

    expect(hunkHeaders).toEqual([
      '@@ -8,7 +8,7 @@ def show_search() -> None:',
      '@@ -21,4 +21,4 @@ class Very_long_name_that_goes_on_and_on_and_on_and_on_and_on_and_on_and_on_and_',
      '@@ -1,3 +1,3 @@',
    ])
  })
})
