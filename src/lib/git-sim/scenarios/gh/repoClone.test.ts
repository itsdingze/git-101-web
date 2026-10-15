import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const REMOTE_URL = 'https://github.com/your-username/todo-app.git'

const LAPTOP: SandboxSeed = {
  dir: '',
  github: { signedIn: true },
  remote: {
    name: 'origin',
    url: REMOTE_URL,
    cloned: false,
    setup: [{ write: { 'app.txt': 'show(tasks)\n' } }, { run: 'git add .' }, { run: 'git commit -m "feat: add task list"' }],
  },
}

describe('gh repo clone', () => {
  it('clones OWNER/REPO exactly as git clone does with its address', async () => {
    const withGh = await createSandbox(LAPTOP)
    const withGit = await createSandbox(LAPTOP)

    expect(await textOf(withGh, 'gh repo clone your-username/todo-app')).toBe(
      await textOf(withGit, `git clone ${REMOTE_URL}`),
    )
    await withGh.run('cd todo-app')
    expect(await textOf(withGh, 'git remote -v')).toBe(
      [`origin\t${REMOTE_URL} (fetch)`, `origin\t${REMOTE_URL} (push)`].join('\n'),
    )
    expect(await textOf(withGh, 'git log --oneline')).toMatch(/feat: add task list$/)
  })

  it('takes the signed-in account as the owner when only the name is given', async () => {
    const sandbox = await createSandbox(LAPTOP)

    expect(await textOf(sandbox, 'gh repo clone todo-app')).toMatch(/^Cloning into 'todo-app'\.\.\./)
  })

  it('clones into the folder named after the repository', async () => {
    const sandbox = await createSandbox(LAPTOP)
    await sandbox.run('gh repo clone your-username/todo-app work')

    expect(await textOf(sandbox, 'ls')).toBe('work')
  })

  it('reports a repository GitHub does not have', async () => {
    const sandbox = await createSandbox(LAPTOP)

    expect(await textOf(sandbox, 'gh repo clone your-username/todo')).toBe(
      "GraphQL: Could not resolve to a Repository with the name 'your-username/todo'. (repository)",
    )
  })

  it('asks for a repository when none is given', async () => {
    const sandbox = await createSandbox(LAPTOP)

    expect(await textOf(sandbox, 'gh repo clone')).toBe('cannot clone: repository argument required')
  })
})
