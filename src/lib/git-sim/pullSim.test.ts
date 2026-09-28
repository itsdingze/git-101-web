import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'

const REMOTE_URL = 'https://github.com/team/project.git'

const DIVERGED_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: REMOTE_URL,
    setup: [
      { write: { 'README.md': '# Project\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
    ahead: [
      { write: { 'CONTRIBUTING.md': '# How to help\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Add contributing guide"' },
    ],
  },
  setup: [
    { write: { 'notes.md': '# Notes\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add notes"' },
  ],
}

const DIVERGENT_ADVICE = [
  'hint: You have divergent branches and need to specify how to reconcile them.',
  'hint: You can do so by running one of the following commands sometime before',
  'hint: your next pull:',
  'hint:',
  'hint:   git config pull.rebase false  # merge',
  'hint:   git config pull.rebase true   # rebase',
  'hint:   git config pull.ff only       # fast-forward only',
  'hint:',
  'hint: You can replace "git config" with "git config --global" to set a default',
  'hint: preference for all repositories. You can also pass --rebase, --no-rebase,',
  'hint: or --ff-only on the command line to override the configured default per',
  'hint: invocation.',
  'fatal: Need to specify how to reconcile divergent branches.',
].join('\n')

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function headSubject(sandbox: Sandbox): Promise<string> {
  return (await textOf(sandbox, 'git log --oneline -n 1')).replace(/^[0-9a-f]{7} (\([^)]*\) )?/, '')
}

describe('pulling into a branch that has diverged', () => {
  it('stops and asks how to reconcile when pull.rebase is unset', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)

    expect(await textOf(sandbox, 'git pull')).toMatch(new RegExp(`\\n${escape(DIVERGENT_ADVICE)}$`))
    expect(await headSubject(sandbox)).toBe('Add notes')
    expect(await textOf(sandbox, 'ls')).toBe('notes.md  README.md')
  })

  it('merges once pull.rebase is set to false globally', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)
    await sandbox.run('git config --global pull.rebase false')

    expect(await textOf(sandbox, 'git pull')).toContain("Merge made by the 'ort' strategy.")
    expect(await headSubject(sandbox)).toBe(
      "Merge branch 'main' of https://github.com/team/project",
    )
    expect(await textOf(sandbox, 'ls')).toBe('CONTRIBUTING.md  notes.md  README.md')
  })

  it('merges when pull.rebase is set to false in the repository', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)
    await sandbox.run('git config pull.rebase false')

    expect(await textOf(sandbox, 'git pull origin main')).toContain("Merge made by the 'ort' strategy.")
  })

  it('merges with --no-rebase whatever the configuration says', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)

    expect(await textOf(sandbox, 'git pull --no-rebase')).toContain("Merge made by the 'ort' strategy.")
  })

  it('refuses to fast-forward with --ff-only', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)

    expect(await textOf(sandbox, 'git pull --ff-only')).toMatch(
      /\nfatal: Not possible to fast-forward, aborting\.$/,
    )
    expect(await headSubject(sandbox)).toBe('Add notes')
  })

  it('says rebasing is not simulated when asked to rebase', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)

    expect(await textOf(sandbox, 'git pull --rebase')).toMatch(
      /^fatal: git pull --rebase is not simulated in this course\./m,
    )
    await sandbox.run('git config --global pull.rebase true')
    expect(await textOf(sandbox, 'git pull')).toMatch(
      /^fatal: git pull --rebase is not simulated in this course\./m,
    )
    expect(await headSubject(sandbox)).toBe('Add notes')
  })
})

describe('pulling into a branch that is only behind', () => {
  it('fast-forwards without asking, even with pull.rebase unset', async () => {
    const sandbox = await createSandbox({ ...DIVERGED_SEED, setup: [] })

    expect(await textOf(sandbox, 'git pull')).toContain('Fast-forward')
  })
})

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
