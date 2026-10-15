import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { GIT_COMMANDS } from '@/lib/git-sim/commands/git/registry'
import type { CommandLocks } from '@/lib/git-sim/input/commandLocks'

const GH_COMMANDS = ['gh auth login', 'gh auth status', 'gh repo clone', 'gh pr create', 'gh pr view', 'gh pr merge']

async function helpText(locks?: CommandLocks): Promise<string> {
  const sandbox: Sandbox = await createSandbox({ dir: 'todo-app' }, locks)
  const result = await sandbox.run('help')
  return result.outputs.map((output) => output.text).join('\n')
}

function namesListed(help: string): string[] {
  return [...help.matchAll(/^ {2}(gh \S+ \S+|\S+)/gm)].map((match) => match[1] ?? '')
}

function lockingAllBut(...unlocked: readonly string[]): CommandLocks {
  return new Map(
    [...Object.keys(GIT_COMMANDS), 'gh']
      .filter((name) => !unlocked.includes(name))
      .map((name) => [name, 'a later lesson']),
  )
}

describe('help', () => {
  it('lists exactly the git and gh commands the course teaches when nothing is locked', async () => {
    const [pwd, ls, cd, ...rest] = namesListed(await helpText())

    expect([pwd, ls, cd]).toEqual(['pwd', 'ls', 'cd'])
    expect(rest.filter((name) => !name.startsWith('gh ')).sort()).toEqual(Object.keys(GIT_COMMANDS).sort())
    expect(rest.filter((name) => name.startsWith('gh '))).toEqual(GH_COMMANDS)
  })

  it('lists only the git commands unlocked so far, and no gh while gh is locked', async () => {
    expect(namesListed(await helpText(lockingAllBut('init', 'config')))).toEqual(['pwd', 'ls', 'cd', 'config', 'init'])
  })

  it('describes each command in plain words', async () => {
    expect(await helpText()).toContain("  restore   throw away changes you haven't committed")
  })

  it('lists the gh commands once gh is unlocked', async () => {
    expect(namesListed(await helpText(lockingAllBut('init', 'gh')))).toEqual(['pwd', 'ls', 'cd', 'init', ...GH_COMMANDS])
  })
})
