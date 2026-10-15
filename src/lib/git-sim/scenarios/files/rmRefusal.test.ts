import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'

async function text(sandbox: Sandbox, line: string): Promise<string> {
  return (await sandbox.run(line)).outputs.map((output) => output.text).join('\n')
}

const LOCAL = [
  'error: the following file has local modifications:',
  '    index.html',
  '(use --cached to keep the file, or -f to force removal)',
].join('\n')

const STAGED = [
  'error: the following file has changes staged in the index:',
  '    index.html',
  '(use --cached to keep the file, or -f to force removal)',
].join('\n')

const BOTH = [
  'error: the following file has staged content different from both the',
  'file and the HEAD:',
  '    index.html',
  '(use -f to force removal)',
].join('\n')

describe('git rm on a file with changes', () => {
  it('refuses an unstaged edit and keeps the file', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "edited" > index.html')

    expect(await text(sandbox, 'git rm index.html')).toBe(LOCAL)
    expect(await text(sandbox, 'cat index.html')).toBe('edited')
    expect((await sandbox.snapshot()).tracked).toContain('index.html')
  })

  it('refuses a staged edit', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "edited" > index.html')
    await sandbox.run('git add index.html')

    expect(await text(sandbox, 'git rm index.html')).toBe(STAGED)
  })

  it('refuses staged content that differs from both the file and HEAD, even with --cached', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "edited" > index.html')
    await sandbox.run('git add index.html')
    await sandbox.run('echo "edited again" > index.html')

    expect(await text(sandbox, 'git rm index.html')).toBe(BOTH)
    expect(await text(sandbox, 'git rm --cached index.html')).toBe(BOTH)
  })

  it('lets --cached untrack an edited file, and -f force the removal', async () => {
    const cached = await createSandbox(COMMITTED_SEED)
    await cached.run('echo "edited" > index.html')
    expect(await text(cached, 'git rm --cached index.html')).toBe("rm 'index.html'")
    expect(await text(cached, 'cat index.html')).toBe('edited')

    const forced = await createSandbox(COMMITTED_SEED)
    await forced.run('echo "edited" > index.html')
    expect(await text(forced, 'git rm -f index.html')).toBe("rm 'index.html'")
    expect((await forced.snapshot()).workdirFiles).not.toContain('index.html')
  })

  it('lists each kind of problem, staged first', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "edited" > index.html')
    await sandbox.run('git add index.html')
    await sandbox.run('echo "body {}" > style.css')

    expect(await text(sandbox, 'git rm style.css index.html')).toBe(
      [
        STAGED,
        'error: the following file has local modifications:',
        '    style.css',
        '(use --cached to keep the file, or -f to force removal)',
      ].join('\n'),
    )
  })
})

describe('git rm on a folder', () => {
  it('needs -r even when the folder holds a single file', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [{ run: 'git init' }, { write: { 'notes/ideas.txt': 'Add search\n' } }, { run: 'git add .' }, { run: 'git commit -m "Initial commit"' }],
    })

    expect(await text(sandbox, 'git rm --cached notes')).toBe("fatal: not removing 'notes' recursively without -r")
    expect(await text(sandbox, 'git rm -r --cached notes')).toBe("rm 'notes/ideas.txt'")
  })
})
