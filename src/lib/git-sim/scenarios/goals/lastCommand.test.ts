import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, meets } from '@/lib/git-sim/scenarios/goalFixtures'

describe('last-command goals', () => {
  it('pass only while the most recent command starts with the given words', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    expect(await meets(sandbox, { kind: 'last-command', startsWith: 'git log' })).toBe(false)

    await sandbox.run('git log --oneline')
    expect(await meets(sandbox, { kind: 'last-command', startsWith: 'git log' })).toBe(true)

    await sandbox.run('git status')
    expect(await meets(sandbox, { kind: 'last-command', startsWith: 'git log' })).toBe(false)
  })

  it('ignore a command that failed, unless the goal allows failure', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('cat ideas.txt')

    expect(await meets(sandbox, { kind: 'last-command', startsWith: 'cat ideas.txt' })).toBe(false)
    expect(await meets(sandbox, { kind: 'last-command', startsWith: 'cat ideas.txt', allowFailure: true })).toBe(true)
  })

  it('ignore extra spaces the learner typed', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('  git   status  ')

    expect(await meets(sandbox, { kind: 'last-command', startsWith: 'git status' })).toBe(true)
  })

  describe('that must name a commit', () => {
    const NAMES_FIX = { kind: 'last-command', startsWith: 'git show', namesCommit: { messageIncludes: 'fix:' } } as const

    async function withFix() {
      const sandbox = await createSandbox(COMMITTED_SEED)
      await sandbox.run('echo "h1 { color: red; }" >> style.css')
      await sandbox.run('git commit -am "fix: colour the heading"')
      await sandbox.run('echo "footer" >> index.html')
      await sandbox.run('git commit -am "feat: add a footer"')
      return sandbox
    }

    async function shortHashOf(message: string, sandbox: Awaited<ReturnType<typeof withFix>>) {
      const commit = (await sandbox.snapshot()).commits.find((entry) => entry.message === message)
      return commit!.oid.slice(0, 7)
    }

    it('pass when the command names that commit by short or full hash', async () => {
      const sandbox = await withFix()
      const short = await shortHashOf('fix: colour the heading', sandbox)

      await sandbox.run(`git show ${short}`)
      expect(await meets(sandbox, NAMES_FIX)).toBe(true)

      const full = (await sandbox.snapshot()).commits.find((entry) => entry.message.startsWith('fix:'))!.oid
      await sandbox.run(`git show ${full}`)
      expect(await meets(sandbox, NAMES_FIX)).toBe(true)
    })

    it('pass when the command names it by a ref', async () => {
      const sandbox = await withFix()

      await sandbox.run('git show HEAD~1')
      expect(await meets(sandbox, NAMES_FIX)).toBe(true)
    })

    it('fail for another commit, or when no commit is named', async () => {
      const sandbox = await withFix()

      await sandbox.run(`git show ${await shortHashOf('feat: add a footer', sandbox)}`)
      expect(await meets(sandbox, NAMES_FIX)).toBe(false)

      await sandbox.run('git show')
      expect(await meets(sandbox, NAMES_FIX)).toBe(false)
    })
  })

  it('forget the command when the sandbox starts over', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git log')
    await sandbox.reset()

    expect(await meets(sandbox, { kind: 'last-command', startsWith: 'git log' })).toBe(false)
  })
})
