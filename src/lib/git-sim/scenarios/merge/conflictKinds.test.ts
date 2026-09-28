import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const MIXED_SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.md': 'one\n', 'b.md': 'one\n', 'old.md': 'old\n', 'gone.md': 'gone\n', 'c.md': 'x\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feature' },
    { write: { 'a.md': 'feature\n', 'b.md': 'feature\n', 'both.md': 'theirs\n', 'c.md': 'fx\n' } },
    { run: 'git rm old.md gone.md' },
    { run: 'git add .' },
    { run: 'git commit -m "Feature work"' },
    { run: 'git switch main' },
    { write: { 'a.md': 'main\n', 'b.md': 'main\n', 'old.md': 'changed\n', 'both.md': 'ours\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Main work"' },
  ],
}

const DELETED_BY_US_SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'old.md': 'old\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feature' },
    { write: { 'old.md': 'feat\n' } },
    { run: 'git commit -am "Change it"' },
    { run: 'git switch main' },
    { run: 'git rm old.md' },
    { run: 'git commit -m "Delete it"' },
  ],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('a merge that stops on several kinds of conflict', () => {
  it('reports each file in path order with its kind of conflict, like real git', async () => {
    const sandbox = await createSandbox(MIXED_SEED)

    expect(await textOf(sandbox, 'git merge feature')).toBe(
      [
        'Auto-merging a.md',
        'CONFLICT (content): Merge conflict in a.md',
        'Auto-merging b.md',
        'CONFLICT (content): Merge conflict in b.md',
        'Auto-merging both.md',
        'CONFLICT (add/add): Merge conflict in both.md',
        'CONFLICT (modify/delete): old.md deleted in feature and modified in HEAD.  Version HEAD of old.md left in tree.',
        'Automatic merge failed; fix conflicts and then commit the result.',
      ].join('\n'),
    )
  })

  it('stages the clean changes, including a deletion, and lists each conflict by kind', async () => {
    const sandbox = await createSandbox(MIXED_SEED)
    await sandbox.run('git merge feature')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'You have unmerged paths.',
        '  (fix conflicts and run "git commit")',
        '  (use "git merge --abort" to abort the merge)',
        '',
        'Changes to be committed:',
        '\tmodified:   c.md',
        '\tdeleted:    gone.md',
        '',
        'Unmerged paths:',
        '  (use "git add/rm <file>..." as appropriate to mark resolution)',
        '\tboth modified:   a.md',
        '\tboth modified:   b.md',
        '\tboth added:      both.md',
        '\tdeleted by them: old.md',
        '',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'ls')).toBe('a.md  b.md  both.md  c.md  old.md')
  })

  it('lets git rm settle the deleted file, and the merge commit then drops it', async () => {
    const sandbox = await createSandbox(MIXED_SEED)
    await sandbox.run('git merge feature')

    expect(await textOf(sandbox, 'git rm old.md')).toBe("rm 'old.md'")
    await sandbox.run('git add a.md b.md both.md')
    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'All conflicts fixed but you are still merging.',
        '  (use "git commit" to conclude merge)',
        '',
        'Changes to be committed:',
        '\tmodified:   a.md',
        '\tmodified:   b.md',
        '\tmodified:   both.md',
        '\tmodified:   c.md',
        '\tdeleted:    gone.md',
        '\tdeleted:    old.md',
        '',
      ].join('\n'),
    )

    expect(await textOf(sandbox, 'git commit -m "Merge feature"')).toMatch(/^\[main [0-9a-f]{7}\] Merge feature$/)
    const merged = (await sandbox.snapshot()).commits.find((commit) => commit.message === 'Merge feature')
    expect(merged?.files.sort()).toEqual(['a.md', 'b.md', 'both.md', 'c.md'])
  })
})

describe('a file deleted here but changed on the incoming branch', () => {
  it('reports it the other way round and lists it as deleted by us', async () => {
    const sandbox = await createSandbox(DELETED_BY_US_SEED)

    expect(await textOf(sandbox, 'git merge feature')).toBe(
      [
        'CONFLICT (modify/delete): old.md deleted in HEAD and modified in feature.  Version feature of old.md left in tree.',
        'Automatic merge failed; fix conflicts and then commit the result.',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'git status')).toContain('\tdeleted by us:   old.md')
    expect(await textOf(sandbox, 'cat old.md')).toBe('feat')

    await sandbox.run('git add old.md')
    expect(await textOf(sandbox, 'git commit -m "Keep it"')).toMatch(/^\[main [0-9a-f]{7}\] Keep it$/)
  })
})

describe('a clean merge that combines both sides of one file', () => {
  it('says it auto-merged the file', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'd.md': 'l1\nl2\nl3\nl4\nl5\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
        { run: 'git switch -c feature' },
        { write: { 'd.md': 'l1\nl2\nl3\nl4\nFEATURE\n' } },
        { run: 'git commit -am "Feature"' },
        { run: 'git switch main' },
        { write: { 'd.md': 'MAIN\nl2\nl3\nl4\nl5\n' } },
        { run: 'git commit -am "Main"' },
      ],
    })

    expect(await textOf(sandbox, 'git merge feature')).toMatch(/^Auto-merging d\.md\nMerge made by the 'ort' strategy\./)
  })
})

describe('git rm on files git would normally protect', () => {
  it('removes a staged new file that is already gone from the folder', async () => {
    const sandbox = await createSandbox(DELETED_BY_US_SEED)
    await sandbox.run('echo "x" > new.md')
    await sandbox.run('git add new.md')
    await sandbox.run('rm new.md')

    expect(await textOf(sandbox, 'git rm new.md')).toBe("rm 'new.md'")
    expect((await sandbox.snapshot()).staged).toEqual([])
  })
})
