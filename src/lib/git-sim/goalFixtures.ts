import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'
import { evaluateGoal, type GoalCheck } from './goals'

export const COMMITTED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    {
      write: {
        'index.html': '<h1>My project</h1>\n',
        'style.css': 'body { margin: 0; }\n',
      },
    },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

export const IGNORED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    {
      write: {
        '.gitignore': '*.log\nnode_modules/\n',
        'app.js': 'console.log("hi")\n',
        'debug.log': 'noise\n',
        'node_modules/left-pad/index.js': 'pad\n',
      },
    },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

export const SECRET_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'app.js': 'one\n', '.env': 'SECRET=1\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { '.gitignore': '.env\n' } },
  ],
}

export const EMPTY_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [{ write: { 'notes.txt': 'hi\n' } }],
}

export async function meets(sandbox: Sandbox, check: GoalCheck): Promise<boolean> {
  return evaluateGoal(check, await sandbox.snapshot())
}

export async function shelvedSandbox(): Promise<Sandbox> {
  const sandbox = await createSandbox(COMMITTED_SEED)
  await sandbox.run('echo "one" > index.html')
  await sandbox.run('git stash push -m "first"')
  await sandbox.run('echo "two" > style.css')
  await sandbox.run('git stash push -m "second"')
  return sandbox
}
