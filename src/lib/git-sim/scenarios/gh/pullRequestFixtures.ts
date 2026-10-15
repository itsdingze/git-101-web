import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

export const REMOTE_URL = 'https://github.com/your-username/todo-app.git'

export const PULL_URL = 'https://github.com/your-username/todo-app/pull/1'

export function teamSeed(teammateApproves = false): SandboxSeed {
  return {
    dir: 'todo-app',
    github: { signedIn: true, teammateApproves },
    remote: {
      name: 'origin',
      url: REMOTE_URL,
      setup: [
        { write: { 'app.txt': 'tasks = load("tasks.txt")\nshow(tasks)\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "feat: add task list"' },
      ],
    },
  }
}

export async function exportBranch(teammateApproves = false): Promise<Sandbox> {
  const sandbox = await createSandbox(teamSeed(teammateApproves))
  await sandbox.run('git switch -c add-export')
  await sandbox.run('echo "save(tasks)" > export.txt')
  await sandbox.run('echo "export_button()" >> app.txt')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m "feat: add export"')
  return sandbox
}

export async function pushedExportBranch(teammateApproves = false): Promise<Sandbox> {
  const sandbox = await exportBranch(teammateApproves)
  await sandbox.run('git push -u origin add-export')
  return sandbox
}

export async function openExportPullRequest(teammateApproves = false): Promise<Sandbox> {
  const sandbox = await pushedExportBranch(teammateApproves)
  await sandbox.run('gh pr create --title "feat: add export" --body "Saves the task list to a file."')
  return sandbox
}
