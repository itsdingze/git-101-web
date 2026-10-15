import { describe, expect, it } from 'vitest'
import { parseLesson } from './parseLesson'
import { parseStory } from './parseStory'

const FRONTMATTER = ['---', 'id: 4', 'title: Your First Commit', 'description: Stage and commit', 'unlocks: [add, commit]', '---']

const STORY = parseStory(
  [
    'start:',
    '  - write: { README.md: "# To-do app\\n" }',
    'after-start-a-repository:',
    '  - story: start',
    '  - run: git init',
  ].join('\n'),
)

function sandbox(...seedLines: string[]) {
  const source = [
    ...FRONTMATTER,
    '',
    '```sandbox-exercise',
    'id: first-commit',
    'title: Practice',
    'brief: Commit it.',
    'mode: goal',
    'seed:',
    ...seedLines.map((line) => `  ${line}`),
    'goals:',
    '  - id: committed',
    '    label: Committed',
    '    check: { kind: working-tree-clean }',
    '```',
  ].join('\n')

  return parseLesson(source, 'lesson.md', STORY).steps[0]
}

describe('story steps in a sandbox seed', () => {
  it('replaces a story step with the steps of that checkpoint', () => {
    expect(sandbox('dir: todo-app', 'setup:', '  - story: start', '  - run: git init')).toMatchObject({
      seed: { dir: 'todo-app', setup: [{ write: { 'README.md': '# To-do app\n' } }, { run: 'git init' }] },
    })
  })

  it('follows a checkpoint that builds on another', () => {
    expect(sandbox('dir: todo-app', 'setup:', '  - story: after-start-a-repository')).toMatchObject({
      seed: { setup: [{ write: { 'README.md': '# To-do app\n' } }, { run: 'git init' }] },
    })
  })

  it('expands story steps in the remote repository too', () => {
    const step = sandbox(
      'dir: todo-app',
      'remote:',
      '  name: origin',
      '  url: https://github.com/study-group/todo-app.git',
      '  setup:',
      '    - story: start',
      '  ahead:',
      '    - story: start',
    )

    expect(step).toMatchObject({
      seed: {
        remote: {
          setup: [{ write: { 'README.md': '# To-do app\n' } }],
          ahead: [{ write: { 'README.md': '# To-do app\n' } }],
        },
      },
    })
  })

  it('rejects a story step that names no checkpoint, listing the ones that exist', () => {
    expect(() => sandbox('dir: todo-app', 'setup:', '  - story: after-lunch')).toThrow(
      'sandbox-exercise "first-commit": no story checkpoint "after-lunch". Checkpoints: start, after-start-a-repository',
    )
  })

  it('rejects a seed step that is not a run, write, or remove', () => {
    expect(() => sandbox('dir: todo-app', 'setup:', '  - runn: git init')).toThrow(/sandbox-exercise "first-commit": seed\.setup\.0/)
  })

  it('rejects a seed that names no folder', () => {
    expect(() => sandbox('setup:', '  - story: start')).toThrow(/sandbox-exercise "first-commit": seed\.dir/)
  })
})

describe('parseStory', () => {
  it('rejects a checkpoint that includes itself', () => {
    expect(() => parseStory(['loop:', '  - story: loop'].join('\n'))).toThrow('story checkpoint "loop" includes itself')
  })

  it('rejects a checkpoint that is not a list of steps', () => {
    expect(() => parseStory('start: git init')).toThrow('story checkpoint "start" must be a list of steps')
  })
})
