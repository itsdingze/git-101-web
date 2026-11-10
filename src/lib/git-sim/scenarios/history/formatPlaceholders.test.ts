import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
    { write: { 'f.txt': `${BASE}x\n` } },
    { run: 'git commit -q -am second' },
  ],
}

function masked(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH').replace(/^Date: {3}.*$/gm, 'Date:   D')
}

describe('git log format placeholders', () => {
  it.each([
    ['%aN', 'Your Name'],
    ['%cN', 'Your Name'],
    ['%aE', 'you@example.com'],
    ['%cE', 'you@example.com'],
    ['%al', 'you'],
    ['%cl', 'you'],
    ['%aL', 'you'],
    ['%cL', 'you'],
    ['%x41', 'A'],
    ['%Cred%s%Creset', 'second'],
    ['%C(red)x', 'x'],
    ['%e|%N', '|'],
  ])('expands %s', async (template, expected) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, `git log -1 --format='${template}'`)).toBe(expected)
  })

  it('expands sanitized subjects', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git commit -q --allow-empty -m "Sub ject: v1.2..3_x!"')

    expect(await textOf(sandbox, 'git log -1 --format=%f')).toBe('Sub-ject-v1.2.3_x')
  })

  it('expands date placeholders', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log -1 --format=%as')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(await textOf(sandbox, 'git log -1 --format=%cs')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(await textOf(sandbox, 'git log -1 --format=%ai')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+0000$/)
    expect(await textOf(sandbox, 'git log -1 --format=%ci')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+0000$/)
    expect(await textOf(sandbox, 'git log -1 --format=%aI')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    expect(await textOf(sandbox, 'git log -1 --format=%cI')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    expect(await textOf(sandbox, 'git log -1 --format=%aD')).toMatch(/^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} \+0000$/)
    expect(await textOf(sandbox, 'git log -1 --format=%cD')).toMatch(/^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} \+0000$/)
  })

  it.each(['%<(10)%s', '%>(10)%s', '%w(10)%s', '%(trailers)', '%G?', '%gs', '%S', '%ah', '%m'])('refuses %s with a course message', async (template) => {
    const sandbox = await createSandbox(SEED)

    const result = await sandbox.run(`git log -1 --format='${template}'`)

    expect(result.outputs).toHaveLength(1)
    expect(result.outputs[0]?.prose).toBe(true)
    expect(result.outputs[0]?.stream).toBe('stderr')
    expect(result.outputs[0]?.text).toMatch(/^This practice terminal doesn't simulate %/)
  })

  it('keeps truly unknown placeholders literal', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, "git log -1 --format='%x0|%xZZ|%z'")).toBe('%x0|%xZZ|%z')
  })
})

describe('git log named formats', () => {
  it('reads email', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --pretty=email -1')).replace(/^Date: .*$/m, 'Date: D')).toBe(
      ['From HASH Mon Sep 17 00:00:00 2001', 'From: Your Name <you@example.com>', 'Date: D', 'Subject: [PATCH] second'].join('\n'),
    )
  })

  it('reads raw', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --pretty=raw -1'))).toBe(
      ['commit HASH', 'tree HASH', 'parent HASH', 'author Your Name <you@example.com> HASH +0000', 'committer Your Name <you@example.com> HASH +0000', '', '    second'].join('\n'),
    )
  })

  it('reads reference', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --pretty=reference -1')).toMatch(/^[0-9a-f]{7} \(second, \d{4}-\d{2}-\d{2}\)$/)
  })

  it('still refuses an unknown name', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --pretty=bogus -1')).toBe('fatal: invalid --pretty format: bogus')
  })
})
