import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function seededWith(files: Readonly<Record<string, string>>): Promise<Sandbox> {
  return createSandbox({ dir: 'project', setup: [{ run: 'git init' }, { write: files }, { run: 'git add .' }, { run: 'git commit -q -m a' }] })
}

function lines(count: number): string {
  return `${Array.from({ length: count }, (_, index) => String(index)).join('\n')}\n`
}

describe('diff stat layout', () => {
  it('fills the bar to the terminal width', async () => {
    const sandbox = await seededWith({ 'a.txt': lines(140) })

    expect(await textOf(sandbox, 'git show --stat --format=')).toBe(` a.txt | 140 ${'+'.repeat(66)}\n 1 file changed, 140 insertions(+)`)
  })

  it('truncates a long name from the left', async () => {
    const name = `${'n'.repeat(70)}.txt`
    const sandbox = await seededWith({ [name]: 'x\n' })

    expect(await textOf(sandbox, 'git show --stat --format=')).toBe(` ...${name.slice(-69)} | 1 +\n 1 file changed, 1 insertion(+)`)
  })

  it('shortens names and bars together', async () => {
    const name = `${'n'.repeat(70)}.txt`
    const sandbox = await seededWith({ [name]: 'x\n', [`dir/sub/${name}`]: 'y\n', 'a.txt': lines(160) })

    const rows = (await textOf(sandbox, 'git show --stat --format=')).split('\n')

    expect(rows[0]).toBe(` a.txt${' '.repeat(45)} | 160 ${'+'.repeat(21)}`)
    expect(rows[1]).toMatch(/^ \.\.\.n+\.txt \| {3}1 \+$/)
    expect(rows[1]).toHaveLength(1 + 50 + 3 + 3 + 2)
  })
})
