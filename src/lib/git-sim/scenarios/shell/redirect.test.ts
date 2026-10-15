import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ write: { 'docs/guide.md': '# Guide\n' } }],
}

describe('redirecting output', () => {
  it.each(['>', '>>'])('into a folder with %s says it is a directory', async (arrow) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, `echo more ${arrow} docs`)).toBe('bash: docs: Is a directory')
    expect(await textOf(sandbox, 'cat docs/guide.md')).toBe('# Guide')
  })

  it('into a folder that does not exist says so and creates nothing', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo hi > missing/notes.txt')).toBe(
      'bash: missing/notes.txt: No such file or directory',
    )
    expect(await textOf(sandbox, 'ls')).toBe('docs')
  })

  it('under a file says it is not a directory', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo hi > docs/guide.md/notes.txt')).toBe(
      'bash: docs/guide.md/notes.txt: Not a directory',
    )
  })
})

describe('a redirect with no usable target', () => {
  it.each(['echo a >', '>', 'echo a >>'])('is a syntax error for %j, and nothing runs', async (line) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe("bash: syntax error near unexpected token `newline'")
  })

  it('treats an empty quoted target as a missing file', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo a > ""')).toBe('bash: : No such file or directory')
  })
})

describe('cat on a folder', () => {
  it('says it is a directory', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'cat docs')).toBe('cat: docs: Is a directory')
  })
})
