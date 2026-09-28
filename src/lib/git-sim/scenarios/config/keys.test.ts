import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

const BLANK = { dir: 'cookbook', identity: { name: '', email: '' } }

describe('git config keys', () => {
  it('refuses a key with no section, like real git, and stores nothing', async () => {
    const sandbox = await createSandbox(BLANK)

    expect(await textOf(sandbox, 'git config --global name Ada')).toBe('error: key does not contain a section: name')
    expect(await textOf(sandbox, 'git config name')).toBe('error: key does not contain a section: name')
    expect(await textOf(sandbox, 'git config --global --list')).toBe('')
  })

  it('refuses a key with no variable name', async () => {
    const sandbox = await createSandbox(BLANK)

    expect(await textOf(sandbox, 'git config --global user. x')).toBe('error: key does not contain variable name: user.')
    expect(await textOf(sandbox, 'git config --global --list')).toBe('')
  })

  it('refuses the same malformed keys real git refuses, and accepts the odd ones it accepts', async () => {
    const sandbox = await createSandbox(BLANK)

    expect(await textOf(sandbox, 'git config --global .name x')).toBe('error: key does not contain a section: .name')
    expect(await textOf(sandbox, 'git config --global user.na_me x')).toBe('error: invalid key: user.na_me')
    expect(await textOf(sandbox, 'git config --global user.1x x')).toBe('error: invalid key: user.1x')
    expect(await textOf(sandbox, 'git config --global user.-x x')).toBe('error: invalid key: user.-x')
    expect(await textOf(sandbox, 'git config --global us_er.x x')).toBe('error: invalid key: us_er.x')
    expect(await textOf(sandbox, 'git config --global user.sub.x x')).toBe('')
    expect(await textOf(sandbox, 'git config --global user.name-x x')).toBe('')
  })

  it('lists every project setting, including pull.rebase, after the global ones', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }] })
    await sandbox.run('git config pull.rebase false')
    await sandbox.run('git config user.sub.x v')

    const listed = (await textOf(sandbox, 'git config --list')).split('\n')
    expect(listed).toContain('pull.rebase=false')
    expect(listed).toContain('user.sub.x=v')
    expect(await textOf(sandbox, 'git config --list --local')).not.toContain('user.email=you@example.com')
  })

  it('treats section and variable names case-insensitively, storing them lower case', async () => {
    const sandbox = await createSandbox(BLANK)
    await sandbox.run('git config --global User.Name "Ada"')

    expect(await textOf(sandbox, 'git config user.name')).toBe('Ada')
    expect(await textOf(sandbox, 'git config USER.NAME')).toBe('Ada')
    expect(await textOf(sandbox, 'git config --global --list')).toBe('user.name=Ada')
  })

  it('removes a setting with --unset, silently, and ignores a missing one', async () => {
    const sandbox = await createSandbox(BLANK)
    await sandbox.run('git config --global user.name "Ada"')

    expect(await textOf(sandbox, 'git config --global --unset user.name')).toBe('')
    expect(await textOf(sandbox, 'git config user.name')).toBe('')
    expect(await textOf(sandbox, 'git config --global --unset user.name')).toBe('')
    expect(await textOf(sandbox, 'git config --global --unset')).toBe('error: wrong number of arguments, should be from 1 to 2')
  })

  it('removes a project setting with --unset inside a repository', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }] })
    await sandbox.run('git config user.email "work@example.com"')

    expect(await textOf(sandbox, 'git config --unset user.email')).toBe('')
    expect(await textOf(sandbox, 'git config user.email')).toBe('you@example.com')
  })

  it('keeps only the first word of an unquoted name, as real git does', async () => {
    const sandbox = await createSandbox(BLANK)

    expect(await textOf(sandbox, 'git config --global user.name Ada Lovelace')).toBe('')
    expect(await textOf(sandbox, 'git config user.name')).toBe('Ada')
  })
})
