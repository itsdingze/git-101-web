// @ts-nocheck
import { it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import story from '@/data/lessons/story.yaml'

const ADA = { name: 'Ada Lovelace', email: 'ada@example.com' }
const TEAM = 'https://github.com/study-group/todo-app.git'
const PULL = { run: 'git config pull.rebase false' }

async function journey(title, seed, lines) {
  const sandbox = await createSandbox({ identity: ADA, ...seed })
  console.log(`\n######## ${title}`)
  for (const line of lines) {
    const prompt = await sandbox.prompt()
    const result = await sandbox.run(line)
    console.log(`${prompt.directory}${prompt.branch ? ` (${prompt.branch})` : ''} $ ${line}`)
    for (const output of result.outputs) console.log(output.stream === 'stderr' ? `[stderr] ${output.text}` : output.text)
  }
}

const local = (checkpoint) => ({ dir: 'todo-app', setup: story[checkpoint] })
const clone = (checkpoint, ahead) => ({
  dir: 'todo-app',
  remote: { name: 'origin', url: TEAM, setup: story[checkpoint], ahead },
  setup: [PULL],
})
const commit = (file, contents, message) => [
  { write: { [file]: contents } },
  { run: `git add ${file}` },
  { run: `git commit -m "${message}"` },
]

it('journeys', async () => {
  await journey('L01', local('start'), [
    'pwd', 'ls', 'cd notes', 'pwd', 'ls', 'cat ideas.txt', 'cd ..', 'cat README.md',
    'echo "tasks = load()"', 'echo "tasks = load()" > app.txt', 'echo "show(tasks)" >> app.txt', 'cat app.txt', 'ls',
  ])
  await journey('L03', local('after-terminal-basics'), [
    'git init', 'ls -a', 'git status', 'echo "MAX_TASKS = 10" > settings.txt', 'git status',
  ])
  await journey('L04', local('after-start-a-repository'), [
    'git add app.txt', 'git status', 'git add .', 'git status', 'git commit -m "feat: add task list"', 'git status',
    'echo "MAX_TASKS = 20" > settings.txt', 'git status', 'git add settings.txt', 'git commit -m "feat: raise the task limit"',
  ])
  await journey('L05', local('after-first-commit'), [
    'echo "MAX_TASKS = 25" > settings.txt', 'git diff', 'git add settings.txt', 'git diff', 'git diff --staged',
    'git commit -m "feat: raise the task limit to 25"', 'git log', 'git log --oneline', 'git log --oneline -2',
    'git show HEAD~1', 'git show',
  ])
  await journey('L06', local('after-see-what-changed'), [
    'echo "Buy milk" > tasks.txt', 'git status', 'echo "tasks.txt" > .gitignore', 'git status',
    'echo "show_due(tasks)" > try-dates.txt', 'git status', 'echo "try-*" >> .gitignore', 'echo "notes/" >> .gitignore',
    'cat .gitignore', 'git status', 'git status --ignored', 'git add .gitignore',
    'git commit -m "chore: ignore my tasks and experiments"', 'git status', 'ls', 'ls -a',
  ])
  await journey('L07', local('after-ignore-files'), [
    'cat .gitignore', 'echo "Add tags" >> notes/ideas.txt', 'git status', 'git rm --cached notes/ideas.txt', 'git status',
    'git commit -m "chore: stop tracking my notes"', 'git status', 'git status --ignored', 'cat notes/ideas.txt', 'ls',
  ])
  await journey('L08', local('after-stop-tracking'), [
    'rm try-dates.txt', 'git status', 'git branch', 'git switch -c add-due-dates', 'git branch',
    'echo "show_due(tasks)" > dates.txt', 'git status', 'git add dates.txt', 'git commit -m "feat: add due dates"', 'ls',
    'git switch main', 'ls', 'git branch', 'git switch add-due-dates', 'ls', 'git log --oneline -3',
  ])
  await journey('L09', local('after-branches'), [
    'git switch main', 'echo "Keeps your tasks in one list." >> README.md', 'git add README.md',
    'git commit -m "docs: describe the app"', 'git merge add-due-dates', 'git log --oneline --graph',
    'git branch -d add-due-dates', 'git branch', 'ls',
  ])
  await journey('L09 fast-forward', local('after-branches'), [
    'git switch main', 'git merge add-due-dates', 'git log --oneline --graph -2',
  ])
  await journey('L10', local('after-merging'), [
    'git switch -c raise-limit', 'echo "MAX_TASKS = 50" > settings.txt', 'git add settings.txt',
    'git commit -m "feat: try a limit of 50"', 'git switch main', 'echo "MAX_TASKS = 30" > settings.txt',
    'git add settings.txt', 'git commit -m "feat: raise the task limit to 30"', 'git merge raise-limit', 'git status',
    'cat settings.txt', 'git merge --abort', 'git status', 'git merge raise-limit', 'echo "MAX_TASKS = 50" > settings.txt',
    'git add settings.txt', 'git status', 'git commit -m "Merge raise-limit"', 'git log --oneline --graph -4',
    'git branch -d raise-limit',
  ])
  await journey('L11', local('after-merge-conflicts'), [
    'echo "search(tasks)" >> app.txt', 'echo "query = ask()" > search.txt', 'git status', 'git stash', 'git status',
    'git stash -u', 'git status', 'ls', 'git stash list', 'echo "show_due(unfinished(tasks))" > dates.txt',
    'git add dates.txt', 'git commit -m "fix: hide due dates on finished tasks"', 'git stash pop', 'git stash pop',
    'git status', 'git stash list',
  ])
  await journey('L12', local('after-stash'), [
    'echo "MAX_TASKS = 9999" > settings.txt', 'git add .', 'git status', 'git restore --staged settings.txt', 'git status',
    'git restore settings.txt', 'git status', 'git commit -m "feat: add serch"', 'git log --oneline -2',
    'git commit --amend -m "feat: add search"', 'git log --oneline -2',
    'echo "Type a word to find matching tasks." > search-help.txt', 'git status', 'git add search-help.txt',
    'git commit --amend --no-edit', 'git log --oneline -2', 'git status', 'git log --oneline',
  ])
  await journey('L12 restore everything', local('after-undo-a-change'), [
    'echo "tasks = everything()" > app.txt', 'echo "MAX_TASKS = 0" > settings.txt', 'echo "todo" > junk.txt', 'git status',
    'git restore .', 'git status', 'rm junk.txt', 'git status',
  ])
  await journey('L13', { dir: '', remote: { name: 'origin', url: TEAM, cloned: false, setup: story['after-undo-a-change'] } }, [
    `git clone ${TEAM}`, 'ls', 'cd todo-app', 'ls', 'git log --oneline -3', 'git remote -v', 'git status',
  ])
  await journey('L14', clone('after-undo-a-change', commit('reminders.txt', 'remind(tasks)\n', 'feat: add reminders')), [
    'echo "tags = ask()" > tags.txt', 'git add tags.txt', 'git commit -m "feat: add tags"', 'git status', 'git push',
    'git pull', 'ls', 'git log --oneline --graph -4', 'git status', 'git push', 'git status',
  ])
  await journey('L15', { dir: 'todo-app', remote: { name: 'origin', url: TEAM, cloned: false }, setup: story['after-undo-a-change'] }, [
    'git remote -v', `git remote add origin ${TEAM}`, 'git remote -v', 'git push -u origin main', 'git status', 'ls',
  ])
  await journey('L16', clone('team-after-push-and-pull', commit('priority.txt', 'PRIORITIES = low, high\n', 'feat: add priorities')), [
    'git switch main', 'git pull', 'git switch -c add-export', 'echo "export(tasks)" > export.txt', 'git add export.txt',
    'git commit -m "feat: add export"', 'git push -u origin add-export', 'git status', 'git log --oneline -3',
  ])
  await journey('L17', clone('team-after-team-workflow'), [
    'echo "THEME = dark" > theme.txt', 'git add theme.txt', 'git commit -m "feat: add dark mode"', 'git push',
    'git log --oneline -3', 'git revert HEAD', 'git log --oneline -4', 'git status', 'git push', 'ls',
  ])
  await journey('L17 older', clone('team-after-team-workflow'), [
    'echo "THEME = dark" > theme.txt', 'git add theme.txt', 'git commit -m "feat: add dark mode"', 'git push',
    'git log --oneline -3', 'git revert HEAD~1', 'git log --oneline -4',
  ])
  await journey('L20', clone('team-after-revert'), [
    'echo "archive(done_tasks)" > archive.txt', 'git add archive.txt', 'git commit -m "feat: add archive"',
    'git log --oneline -3', 'git reset --hard HEAD~1', 'ls', 'git log --oneline -2', 'git reflog',
    'git switch -c recovered HEAD@{1}', 'ls', 'git switch main', 'git merge recovered', 'git branch -d recovered',
    'git status', 'git push',
  ])
  await journey('L20 soft', clone('team-after-revert'), [
    'echo "archive(done_tasks)" > archive.txt', 'git add archive.txt', 'git commit -m "feat: add archive"',
    'git reset --soft HEAD~1', 'git log --oneline -2', 'git status',
  ])
  await journey('L21', clone('team-after-reset-and-reflog', commit('subtasks.txt', 'subtasks = split(task)\n', 'feat: add subtasks')), [
    'git status', 'git fetch origin', 'git status', 'git log --oneline -2 origin/main', 'ls', 'git pull', 'ls',
  ])
})
