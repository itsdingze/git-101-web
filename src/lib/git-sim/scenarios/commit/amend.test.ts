import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'style.css': 'body { margin: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add stylesheet"' },
  ],
}

const EMPTY_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [{ run: 'git init' }],
}

const ROOT_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

const GIT_DATE_LINE = /^ Date: \w{3} \w{3} \d{1,2} \d{2}:\d{2}:\d{2} \d{4} \+0000$/m

async function headHash(sandbox: Sandbox): Promise<string> {
  const newest = (await textOf(sandbox, 'git log --oneline')).split('\n')[0] ?? ''
  return newest.split(' ')[0] ?? ''
}

describe('git commit --amend', () => {
  it('replaces the last commit and its message with a differently hashed one', async () => {
    const sandbox = await createSandbox(SEED)
    const replaced = await headHash(sandbox)

    const output = await textOf(sandbox, 'git commit --amend -m "Add site styles"')
    expect(output).toMatch(/^\[main [0-9a-f]{7}\] Add site styles$/m)
    expect(output).toMatch(GIT_DATE_LINE)
    expect(output).toContain('1 file changed, 1 insertion(+)')

    expect(await headHash(sandbox)).not.toBe(replaced)
    expect((await textOf(sandbox, 'git log --oneline')).split('\n')).toHaveLength(2)
    expect(await textOf(sandbox, 'git log --oneline')).not.toContain('Add stylesheet')
  })

  it('absorbs newly staged changes with --no-edit and keeps the old message', async () => {
    const sandbox = await createSandbox(SEED)
    const replaced = await headHash(sandbox)

    await sandbox.run('echo "body { margin: 0; padding: 0; }" > style.css')
    await sandbox.run('git add style.css')

    const output = await textOf(sandbox, 'git commit --amend --no-edit')
    expect(output).toMatch(/^\[main [0-9a-f]{7}\] Add stylesheet$/m)
    expect(await headHash(sandbox)).not.toBe(replaced)
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })

  it('never calls an amended root commit a root-commit', async () => {
    const sandbox = await createSandbox(ROOT_SEED)

    const output = await textOf(sandbox, 'git commit --amend -m "Better message"')
    expect(output).toMatch(/^\[main [0-9a-f]{7}\] Better message$/m)
    expect(output).not.toContain('root-commit')
  })

  it('refuses to open an editor when no message is offered', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git commit --amend')).toBe(
      [
        "This practice terminal has no text editor, so you can't type a message in one.",
        'Add a new message with git commit --amend -m "your message", or keep the old one with git commit --amend --no-edit',
      ].join('\n'),
    )
  })

  it('keeps the whole message, body included, with --no-edit', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "h1 { color: navy; }" >> style.css')
    await sandbox.run('git add style.css')
    await sandbox.run('git commit -m "Style the heading" -m "Navy matches the logo."')

    await sandbox.run('git commit --amend --no-edit')

    expect(await textOf(sandbox, 'git log -1')).toContain('    Style the heading\n    \n    Navy matches the logo.')
  })

  it('has nothing to amend in a repository without commits', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await textOf(sandbox, 'git commit --amend -m "Too early"')).toBe(
      'fatal: You have nothing to amend.',
    )
  })
})
