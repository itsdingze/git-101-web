import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function sandboxNamed(name: string): Promise<Sandbox> {
  return createSandbox({ dir: 'project', identity: { name, email: 'ada@example.com' } })
}

describe('git config with an unquoted two-word value, like git 2.51', () => {
  it('stores the first word when no name is set', async () => {
    const sandbox = await sandboxNamed('')

    expect(await textOf(sandbox, 'git config --global user.name Ada Lovelace')).toBe('')
    expect(await textOf(sandbox, 'git config --global user.name')).toBe('Ada')
  })

  it('adds a second name when the extra word matches no existing name', async () => {
    const sandbox = await sandboxNamed('Your Name')

    expect(await textOf(sandbox, 'git config --global user.name Ada Lovelace')).toBe('')
    expect(await textOf(sandbox, 'git config --global --list')).toBe(
      'user.name=Your Name\nuser.email=ada@example.com\nuser.name=Ada',
    )
    expect(await textOf(sandbox, 'git config --global user.name')).toBe('Ada')
  })

  it('refuses to overwrite two names with one, and changes nothing', async () => {
    const sandbox = await sandboxNamed('Your Name')
    await sandbox.run('git config --global user.name Ada Lovelace')

    expect(await textOf(sandbox, 'git config --global user.name "Ada Lovelace"')).toBe(
      [
        'warning: user.name has multiple values',
        'error: cannot overwrite multiple values with a single value',
        '       Use a regexp, --add or --replace-all to change user.name.',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'git config --global user.name')).toBe('Ada')
  })

  it('replaces the name in place when the extra word matches it', async () => {
    const sandbox = await sandboxNamed('Ada Lovelace')

    expect(await textOf(sandbox, 'git config --global user.name Ada Lovelace')).toBe('')
    expect(await textOf(sandbox, 'git config --global --list')).toBe('user.name=Ada\nuser.email=ada@example.com')
  })

  it('warns and keeps both names when asked to unset one of two', async () => {
    const sandbox = await sandboxNamed('Your Name')
    await sandbox.run('git config --global user.name Ada Lovelace')

    expect(await textOf(sandbox, 'git config --global --unset user.name')).toBe('warning: user.name has multiple values')
    expect(await textOf(sandbox, 'git config --global user.name')).toBe('Ada')
  })

  it('adds a second name in the project config too', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }] })
    await sandbox.run('git config user.name Grace')

    expect(await textOf(sandbox, 'git config user.name Ada Lovelace')).toBe('')
    expect(await textOf(sandbox, 'git config user.name')).toBe('Ada')
    expect(await textOf(sandbox, 'git config user.name "Ada Lovelace"')).toContain(
      'error: cannot overwrite multiple values with a single value',
    )
  })

  it('replaces two names with one using --replace-all', async () => {
    const sandbox = await sandboxNamed('Your Name')
    await sandbox.run('git config --global user.name Ada Lovelace')

    expect(await textOf(sandbox, 'git config --global --replace-all user.name "Ada Lovelace"')).toBe('')
    expect(await textOf(sandbox, 'git config --global --list')).toBe(
      'user.email=ada@example.com\nuser.name=Ada Lovelace',
    )
  })
})
