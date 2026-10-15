import { describe, expect, it } from 'vitest'
import { createSandbox, type SeedStep } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const TWO_FINISHED_BRANCHES: SeedStep[] = [
  { run: 'git init' },
  { write: { 'index.html': 'i\n' } },
  { run: 'git add .' },
  { run: 'git commit -m "Initial commit"' },
  { run: 'git switch -c fix-footer' },
  { write: { 'footer.html': 'f\n' } },
  { run: 'git add .' },
  { run: 'git commit -m "Add footer"' },
  { run: 'git switch main' },
  { write: { 'index.html': 'fix\n' } },
  { run: 'git commit -am "Fix broken link in header"' },
  { run: 'git switch -c add-navbar' },
  { write: { 'navbar.html': 'n\n' } },
  { run: 'git add .' },
  { run: 'git commit -m "Add navbar"' },
  { run: 'git switch main' },
]

function shapeOf(graph: string): string[] {
  return graph.split('\n').map((line) => line.replace(/[0-9a-f]{40}|[0-9a-f]{7}/g, 'x'))
}

describe('git log --graph draws what real git draws', () => {
  it('draws the three-parent commit of a stash with untracked files like an octopus merge', async () => {
    const sandbox = await createSandbox({ dir: 'project' })
    for (const line of ['git init', 'echo a > a', 'git add .', 'git commit -m c1', 'echo u > u', 'git stash -u']) {
      await sandbox.run(line)
    }

    expect(shapeOf(await textOf(sandbox, 'git log --all --oneline --graph'))).toEqual([
      '*-.   x (refs/stash) WIP on main: x c1',
      '|\\ \\',
      '| | * x untracked files on main: x c1',
      '| * x index on main: x c1',
      '|/',
      '* x (HEAD -> main) c1',
    ])
  })

  it('fast-forwards one branch, then merges the other', async () => {
    const sandbox = await createSandbox({ dir: 'site', setup: TWO_FINISHED_BRANCHES })
    await sandbox.run('git merge add-navbar')
    await sandbox.run('git merge fix-footer')

    expect(shapeOf(await textOf(sandbox, 'git log --oneline --graph'))).toEqual([
      "*   x (HEAD -> main) Merge branch 'fix-footer'",
      '|\\',
      '| * x (fix-footer) Add footer',
      '* | x (add-navbar) Add navbar',
      '* | x Fix broken link in header',
      '|/',
      '* x Initial commit',
    ])
  })

  it('merges both branches, crossing the older line over the newer one', async () => {
    const sandbox = await createSandbox({ dir: 'site', setup: TWO_FINISHED_BRANCHES })
    await sandbox.run('git merge fix-footer')
    await sandbox.run('git merge add-navbar')

    expect(shapeOf(await textOf(sandbox, 'git log --oneline --graph'))).toEqual([
      "*   x (HEAD -> main) Merge branch 'add-navbar'",
      '|\\',
      '| * x (add-navbar) Add navbar',
      "* |   x Merge branch 'fix-footer'",
      '|\\ \\',
      '| |/',
      '|/|',
      '| * x (fix-footer) Add footer',
      '* | x Fix broken link in header',
      '|/',
      '* x Initial commit',
    ])
  })

  it('threads the long format through the merge lines', async () => {
    const sandbox = await createSandbox({
      dir: 'site',
      setup: [
        { run: 'git init' },
        { write: { 'index.html': 'i\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
        { run: 'git switch -c side' },
        { write: { 'footer.html': 'f\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Add footer"' },
        { run: 'git switch main' },
        { write: { 'index.html': 'fix\n' } },
        { run: 'git commit -am "Fix link"' },
        { run: 'git merge side' },
      ],
    })

    const lines = shapeOf(await textOf(sandbox, 'git log --graph')).map((line) =>
      line.replace(/Date: {3}.*$/, 'Date:   D').replace(/Author: .*$/, 'Author: A'),
    )

    expect(lines).toEqual([
      '*   commit x (HEAD -> main)',
      '|\\  Merge: x x',
      '| | Author: A',
      '| | Date:   D',
      '| |',
      "| |     Merge branch 'side'",
      '| |',
      '| * commit x (side)',
      '| | Author: A',
      '| | Date:   D',
      '| |',
      '| |     Add footer',
      '| |',
      '* | commit x',
      '|/  Author: A',
      '|   Date:   D',
      '|',
      '|       Fix link',
      '|',
      '* commit x',
      '  Author: A',
      '  Date:   D',
      '',
      '      Initial commit',
    ])
  })
})
