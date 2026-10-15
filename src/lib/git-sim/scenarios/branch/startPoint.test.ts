import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function branchNames(sandbox: Sandbox): Promise<string[]> {
  return (await sandbox.snapshot()).branches
}

describe('a branch name typed with a space in it', () => {
  it('makes git branch refuse the second word as a start point and create nothing', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git branch add navbar')).toBe("fatal: not a valid object name: 'navbar'")
    expect(await branchNames(sandbox)).toEqual(['main'])
  })

  it('still lets git branch start from a real commit or branch', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git branch add-navbar main')).toBe('')
    expect(await branchNames(sandbox)).toEqual(['add-navbar', 'main'])
  })

  it('makes git switch -c refuse an unknown start point and stay put', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git switch -c add navbar')).toBe('fatal: invalid reference: navbar')
    expect(await branchNames(sandbox)).toEqual(['main'])
    expect((await sandbox.snapshot()).branch).toBe('main')
  })
})
