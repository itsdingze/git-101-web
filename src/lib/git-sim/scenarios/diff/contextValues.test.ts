import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'

async function dirty(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
    ],
  })
  await sandbox.writeFile('f.txt', `${BASE}x\n`)
  return sandbox
}

describe('git diff context values', () => {
  it.each([
    ['git diff -Uabc', 'error: --unified expects a numerical value'],
    ['git diff --unified=abc', 'error: --unified expects a numerical value'],
    ['git diff -U-1', 'error: --unified expects a non-negative integer'],
  ])('%s is refused', async (line, message) => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, line)).toBe(message)
  })

  it.each(['-U', '--unified'])('%s alone uses the default', async (option) => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, `git diff ${option}`)).toContain('@@ -1,3 +1,4 @@')
  })

  it('prints a stat and a patch for -U with --stat', async () => {
    const sandbox = await dirty()

    const text = (await textOf(sandbox, 'git diff -U1 --stat')).replace(/\b[0-9a-f]{7}\b/g, 'H')

    expect(text).toBe(
      [
        ' f.txt | 1 +',
        ' 1 file changed, 1 insertion(+)',
        '',
        'diff --git a/f.txt b/f.txt',
        'index H..H 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -3 +3,2 @@ two',
        ' three',
        '+x',
      ].join('\n'),
    )
  })

  it('lets --name-only win over -U', async () => {
    const sandbox = await dirty()

    expect(await textOf(sandbox, 'git diff -U1 --name-only')).toBe('f.txt')
  })
})
