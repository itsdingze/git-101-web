import { describe, expect, it } from 'vitest'
import { parseLesson } from './parseLesson'

const FRONTMATTER = ['---', 'id: 3', 'title: Your First Commit', 'description: Stage and commit', 'unlocks: [add, commit]', '---']

function lesson(...body: string[]) {
  return parseLesson([...FRONTMATTER, '', ...body].join('\n'), 'lesson.md')
}

describe('parseLesson', () => {
  it('reads the lesson details from the frontmatter and a reading step from a heading', () => {
    expect(lesson('## Staging files {#staging-files}', '', 'Pick what goes in.')).toEqual({
      id: 3,
      title: 'Your First Commit',
      description: 'Stage and commit',
      unlocks: ['add', 'commit'],
      steps: [
        {
          type: 'reading',
          id: 'staging-files',
          title: 'Staging files',
          content: [{ type: 'text', value: 'Pick what goes in.' }],
        },
      ],
    })
  })

  it('rejects a frontmatter field it does not know, like the retired extra flag', () => {
    const extra = () =>
      parseLesson(
        ['---', 'id: 20', 'title: Extra', 'description: More', 'unlocks: []', 'extra: true', '---', '', '## A {#a}', '', 'Text.'].join('\n'),
        'lesson.md',
      )

    expect(extra).toThrow(/^lesson\.md:8: .*extra/)
  })

  it('rejects a stray ::: under a heading with its line instead of hanging', () => {
    expect(() => lesson('## A {#a}', '', 'Text.', ':::')).toThrow(/^lesson\.md:11: .*no :::tabs block is open/)
  })

  it('rejects a stray ::tab line under a heading with its line instead of hanging', () => {
    expect(() => lesson('## A {#a}', '', '::tab macOS')).toThrow(/^lesson\.md:10: .*::tab only belongs inside a :::tabs block/)
  })

  it('rejects duplicate step ids instead of rendering duplicated lesson sections', () => {
    expect(() => lesson(
      '## The prompt {#the-prompt}',
      '',
      'A prompt shows the current folder.',
      '',
      '## The prompt again {#the-prompt}',
      '',
      'Duplicated content.',
    )).toThrow('step id "the-prompt" is already used in this lesson')
  })

  it('reads a fenced code block, blank lines included, as one code block', () => {
    const { steps } = lesson('## Status {#status}', '', '```bash', 'git status', '', 'git log', '```')

    expect(steps[0]).toMatchObject({ content: [{ type: 'code', language: 'bash', value: 'git status\n\ngit log' }] })
  })

  it('reads a fence named like a built-in object property as a code block, not an exercise', () => {
    const { steps } = lesson('## A {#a}', '', '```constructor', 'value', '```')

    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({ content: [{ type: 'code', language: 'constructor', value: 'value' }] })
  })

  it('reads a diff block as a file path and lines marked unchanged, added or removed', () => {
    const { steps } = lesson('## Due dates {#due}', '', '```diff ~/todo-app/app.txt', ' show(tasks)', '-show_all()', '+show_due(tasks)', '', '```')

    expect(steps[0]).toMatchObject({
      content: [
        {
          type: 'diff',
          path: '~/todo-app/app.txt',
          fileName: 'app.txt',
          folder: 'todo-app',
          lines: [
            { change: 'unchanged', text: 'show(tasks)' },
            { change: 'removed', text: 'show_all()' },
            { change: 'added', text: 'show_due(tasks)' },
            { change: 'unchanged', text: '' },
          ],
        },
      ],
    })
  })

  it('reads a diff block inside a tab', () => {
    const { steps } = lesson('## Tabs {#tabs}', '', ':::tabs os Pick one', '::tab Mac', '```diff ~/todo-app/app.txt', '+show(tasks)', '```', ':::')

    expect(steps[0]).toMatchObject({
      content: [{ type: 'tabs', tabs: [{ content: [{ type: 'diff', fileName: 'app.txt' }] }] }],
    })
  })

  it('rejects a diff line without a marker, naming the file and line', () => {
    const broken = () => lesson('## Due dates {#due}', '', '```diff ~/todo-app/app.txt', ' show(tasks)', 'show_due(tasks)', '```')

    expect(broken).toThrow(
      'lesson.md:12: start each diff line with a space (unchanged), + (added) or - (removed)',
    )
  })

  it('reads a terminal block as prompted command lines, output lines and notes, notes lined up', () => {
    const { steps } = lesson(
      '## Paths {#paths}',
      '',
      '```terminal',
      '~ $ cd projects          # change directory',
      '~/projects $ pwd  # where am I?',
      '/home/user/projects',
      '',
      '# a whole-line note',
      '~/todo-app (main) $ git commit -m "Fix  #12"',
      '~/todo-app (main) $',
      '```',
    )

    expect(steps[0]).toMatchObject({
      content: [
        {
          type: 'terminal',
          lines: [
            { kind: 'command', prompt: { directory: '~', branch: null }, text: 'cd projects', note: '   # change directory' },
            { kind: 'command', prompt: { directory: '~/projects', branch: null }, text: 'pwd', note: '  # where am I?' },
            { kind: 'output', text: '/home/user/projects', note: '' },
            { kind: 'output', text: '', note: '' },
            { kind: 'note', text: '# a whole-line note' },
            { kind: 'command', prompt: { directory: '~/todo-app', branch: 'main' }, text: 'git commit -m "Fix  #12"', note: '' },
            { kind: 'command', prompt: { directory: '~/todo-app', branch: 'main' }, text: '', note: '' },
          ],
        },
      ],
    })
  })

  it('reads a terminal block inside a tab', () => {
    const { steps } = lesson('## Tabs {#tabs}', '', ':::tabs os Pick one', '::tab Mac', '```terminal', '~ $ ls', 'projects', '```', ':::')

    expect(steps[0]).toMatchObject({
      content: [
        {
          type: 'tabs',
          tabs: [{ content: [{ type: 'terminal', lines: [{ kind: 'command', text: 'ls' }, { kind: 'output', text: 'projects' }] }] }],
        },
      ],
    })
  })

  it.each(['', 'app.txt', '~', '/home/user/todo-app/app.txt', '~/todo-app/'])(
    'rejects a diff block whose path "%s" is not a file written from ~, naming the file and line',
    (path) => {
      expect(() => lesson('## Due dates {#due}', '', `\`\`\`diff ${path}`, '+show(tasks)', '```')).toThrow(
        'lesson.md:10: write the file\'s path after diff the way the terminal shows it, starting at ~, like "```diff ~/projects/todo-app/app.py"',
      )
    },
  )

  it('reads a files block as the home folder tree, nested two spaces per level, and the folder it opens at', () => {
    const { steps } = lesson(
      '## Look {#look}',
      '',
      '```files ~/todo-app',
      'todo-app/',
      '  app.txt',
      '',
      '  notes/',
      '    today.txt',
      '  .git/',
      '  .env',
      'letter.txt',
      '```',
    )

    expect(steps[0]).toEqual({
      type: 'reading',
      id: 'look',
      title: 'Look',
      content: [
        {
          type: 'files',
          path: '~/todo-app',
          home: [
            {
              name: 'todo-app',
              kind: 'folder',
              hidden: false,
              entries: [
                { name: 'app.txt', kind: 'file', hidden: false },
                { name: 'notes', kind: 'folder', hidden: false, entries: [{ name: 'today.txt', kind: 'file', hidden: false }] },
                { name: '.git', kind: 'folder', hidden: true, entries: [] },
                { name: '.env', kind: 'file', hidden: true },
              ],
            },
            { name: 'letter.txt', kind: 'file', hidden: false },
          ],
        },
      ],
    })
  })

  it('reads a files block inside a tab', () => {
    const { steps } = lesson('## Tabs {#tabs}', '', ':::tabs os Pick one', '::tab Mac', '```files ~/todo-app', 'todo-app/', '```', ':::')

    expect(steps[0]).toMatchObject({
      content: [{ type: 'tabs', tabs: [{ content: [{ type: 'files', path: '~/todo-app' }] }] }],
    })
  })

  it.each(['', 'todo-app', '/home/user/todo-app', '~todo-app', '~/todo-app/', '~/projects/../recipes'])(
    'rejects a files block whose path "%s" is not written from ~, naming the file and line',
    (path) => {
      expect(() => lesson('## Look {#look}', '', `\`\`\`files ${path}`, 'app.txt', '```')).toThrow(
        'lesson.md:10: write the folder\'s path after files the way the terminal shows it, starting at ~, like "```files ~/todo-app"',
      )
    },
  )

  it('rejects a files entry with a path inside it, naming the file and line', () => {
    expect(() => lesson('## Look {#look}', '', '```files ~', 'app.txt', 'notes/today.txt', '```')).toThrow(
      'lesson.md:12: write one name per line, like "notes/", and indent what sits inside a folder under it',
    )
  })

  it('rejects a files entry listed twice in one folder, naming the file and line', () => {
    expect(() => lesson('## Look {#look}', '', '```files ~', 'app.txt', 'app.txt', '```')).toThrow(
      'lesson.md:12: "app.txt" is already listed in this folder',
    )
  })

  it.each([
    ['one space', ['notes/', ' today.txt']],
    ['two levels at once', ['notes/', '    today.txt']],
  ])('rejects a files entry indented by %s, naming the file and line', (_, entries) => {
    expect(() => lesson('## Look {#look}', '', '```files ~', ...entries, '```')).toThrow(
      'lesson.md:12: indent each entry two spaces more than the folder it sits in',
    )
  })

  it('rejects a files entry indented under a file, naming the file and line', () => {
    expect(() => lesson('## Look {#look}', '', '```files ~', 'notes.txt', '  today.txt', '```')).toThrow(
      'lesson.md:12: "notes.txt" is a file, so nothing can sit inside it. Mark a folder with a trailing /, like "notes/"',
    )
  })

  it.each([
    ['missing from the tree', ['notes/']],
    ['a file in the tree', ['todo-app']],
  ])('rejects a files block whose path names a folder %s, naming the file and line', (_, entries) => {
    expect(() => lesson('## Look {#look}', '', '```files ~/todo-app', ...entries, '```')).toThrow(
      'lesson.md:10: list ~/todo-app as a folder in the tree, like "todo-app/", so the window can open there',
    )
  })

  it('accepts the same name in two different folders', () => {
    const { steps } = lesson('## Look {#look}', '', '```files ~', 'a/', '  notes.txt', 'b/', '  notes.txt', '```')

    expect(steps[0]).toMatchObject({ content: [{ type: 'files', home: [{ name: 'a' }, { name: 'b' }] }] })
  })

  it('reads bulleted and numbered lists', () => {
    const { steps } = lesson('## Lists {#lists}', '', '- one', '- two', '', '1. first', '2. second')

    expect(steps[0]).toMatchObject({
      content: [
        { type: 'list', items: ['one', 'two'] },
        { type: 'list', ordered: true, items: ['first', 'second'] },
      ],
    })
  })

  it('reads callouts written as GitHub alerts, with or without a title', () => {
    const { steps } = lesson(
      '## Careful {#careful}',
      '',
      '> [!WARNING] Keep the quotes',
      '> A name with a space needs quotes.',
      '> Otherwise Git saves one word.',
      '',
      '> [!TIP]',
      '> Press the up arrow.',
    )

    expect(steps[0]).toMatchObject({
      content: [
        {
          type: 'callout',
          variant: 'warning',
          title: 'Keep the quotes',
          value: 'A name with a space needs quotes.\nOtherwise Git saves one word.',
        },
        { type: 'callout', variant: 'tip', value: 'Press the up arrow.' },
      ],
    })
  })

  it('reads tabs, each holding its own blocks', () => {
    const { steps } = lesson(
      '## Install {#install}',
      '',
      ':::tabs os Choose your computer',
      '::tab Windows',
      'Run the installer.',
      '',
      '> [!TIP] Check it worked',
      '> Run `git --version`.',
      '::tab Mac',
      '```bash',
      'git --version',
      '```',
      ':::',
      '',
      'Both work.',
    )

    expect(steps[0]).toMatchObject({
      content: [
        {
          type: 'tabs',
          group: 'os',
          label: 'Choose your computer',
          tabs: [
            {
              label: 'Windows',
              content: [
                { type: 'text', value: 'Run the installer.' },
                { type: 'callout', variant: 'tip', title: 'Check it worked', value: 'Run `git --version`.' },
              ],
            },
            { label: 'Mac', content: [{ type: 'code', language: 'bash', value: 'git --version' }] },
          ],
        },
        { type: 'text', value: 'Both work.' },
      ],
    })
  })

  it('rejects tabs without a label for screen readers, naming the file and line', () => {
    expect(() => lesson('## Install {#install}', '', ':::tabs os', '::tab Mac', 'Text.', ':::')).toThrow(
      'lesson.md:10: name the tab group, then label the tabs, like ":::tabs os Choose your computer"',
    )
  })

  it('attaches the diagram in a visualization block that ends the step, with its data', () => {
    const { steps } = lesson(
      '## Three places {#three}',
      '',
      'Text.',
      '',
      '```visualization three-place-model',
      'files: [ .gitignore, app.txt ]',
      'ignored: [ tasks.txt ]',
      'stageFirst: app.txt',
      'commitMessage: "feat: add task list"',
      '```',
    )

    expect(steps).toEqual([
      {
        type: 'reading',
        id: 'three',
        title: 'Three places',
        content: [{ type: 'text', value: 'Text.' }],
        visualization: {
          kind: 'three-place-model',
          files: ['.gitignore', 'app.txt'],
          ignored: ['tasks.txt'],
          stageFirst: 'app.txt',
          commitMessage: 'feat: add task list',
        },
      },
    ])
  })

  it('plays a git graph from its commands, one stage before them and one after each', () => {
    const { steps } = lesson(
      '## Branch {#branch}',
      '',
      '```visualization git-graph',
      'setup:',
      `  - 'git commit -m "feat: one"'`,
      'commands:',
      '  - git switch -c two',
      `  - 'git commit -m "feat: two"'`,
      '```',
    )

    const main = { name: 'main', lane: 0 }
    const one = { id: 'c1', message: 'feat: one', branch: 'main', parents: [] }
    expect(steps[0]).toMatchObject({
      visualization: {
        kind: 'git-graph',
        commands: ['git switch -c two', 'git commit -m "feat: two"'],
        stages: [
          { commits: [one], branches: [main], head: 'main' },
          { commits: [one], branches: [main, { name: 'two', lane: 1, startsAt: 'c1' }], head: 'two' },
          {
            commits: [one, { id: 'c2', message: 'feat: two', branch: 'two', parents: ['c1'] }],
            branches: [main, { name: 'two', lane: 1 }],
            head: 'two',
          },
        ],
      },
    })
  })

  it('rejects a visualization block without a kind, naming the file and line', () => {
    expect(() => lesson('## A {#a}', '', '```visualization', 'file: app.txt', '```')).toThrow(
      'lesson.md:10: name the diagram after visualization, like "```visualization git-graph"',
    )
  })

  it('rejects a visualization kind it does not know, naming the file and line', () => {
    expect(() => lesson('## A {#a}', '', '```visualization pie-chart', 'file: app.txt', '```')).toThrow(
      'lesson.md:10: unknown visualization "pie-chart", use one of three-place-model, git-graph',
    )
  })

  it('rejects a visualization kind named like a built-in object property', () => {
    expect(() => lesson('## A {#a}', '', '```visualization toString', 'file: app.txt', '```')).toThrow(
      'lesson.md:10: unknown visualization "toString", use one of three-place-model, git-graph',
    )
  })

  it('rejects visualization data with a missing field, naming the file, line, and field', () => {
    const broken = () =>
      lesson('## A {#a}', '', '```visualization three-place-model', 'files: [ app.txt ]', 'ignored: []', 'stageFirst: app.txt', '```')

    expect(broken).toThrow(/^lesson\.md:10: visualization three-place-model: commitMessage/)
  })

  it('rejects a three-place model that stages a file it does not list first', () => {
    const broken = () =>
      lesson(
        '## A {#a}',
        '',
        '```visualization three-place-model',
        'files: [ app.txt ]',
        'ignored: []',
        'stageFirst: tasks.txt',
        'commitMessage: "feat: add task list"',
        '```',
      )

    expect(broken).toThrow(/^lesson\.md:10: visualization three-place-model: stageFirst: .*one of the files/)
  })

  it('rejects a git graph command the diagram cannot play, naming the file and line', () => {
    const broken = () => lesson('## A {#a}', '', '```visualization git-graph', 'setup: []', 'commands: [ git push ]', '```')

    expect(broken).toThrow(/^lesson\.md:10: visualization git-graph: .*"git push"/)
  })

  it('rejects content after a visualization block, since the diagram shows at the end of its step', () => {
    const broken = () =>
      lesson('## A {#a}', '', '```visualization git-graph', 'setup: []', 'commands: []', '```', '', 'More text.')

    expect(broken).toThrow('lesson.md:15: the diagram shows at the end of its step, so put the visualization block last')
  })

  it('rejects a heading with more than one id', () => {
    expect(() => lesson('## A {#a #b}', '', 'Text.')).toThrow('lesson.md:8: give the step one id, like "{#staging-files}"')
  })

  it('rejects the retired visualization heading attribute', () => {
    expect(() => lesson('## A {#a visualization=git-graph}', '', 'Text.')).toThrow(
      'lesson.md:8: unknown heading attribute "visualization=git-graph", use #id and put a diagram in a visualization block',
    )
  })

  it('reads an exercise step from a fenced YAML block named after its type', () => {
    const { steps } = lesson(
      '## Staging {#staging}',
      '',
      'Text.',
      '',
      '```block-exercise',
      'id: build-add',
      'prompt: Build the command',
      'availableBlocks: [git, add, .]',
      'correctAnswer: [git, add, .]',
      '```',
    )

    expect(steps[1]).toEqual({
      type: 'block-exercise',
      id: 'build-add',
      prompt: 'Build the command',
      availableBlocks: ['git', 'add', '.'],
      correctAnswer: ['git', 'add', '.'],
    })
  })

  it('rejects an exercise with a missing field, naming the file, line, and field', () => {
    const broken = () =>
      lesson('## Q {#q}', '', 'Text.', '', '```quiz', 'id: q1', 'question: Why?', 'options: [{ text: A }, { text: B }]', 'explanation: Because.', '```')

    expect(broken).toThrow(/^lesson\.md:12: quiz "q1": correctIndex/)
  })

  it('rejects a quiz whose correctIndex points past its options', () => {
    const broken = () =>
      lesson('## Q {#q}', '', 'Text.', '', '```quiz', 'id: q1', 'question: Why?', 'options: [{ text: A }, { text: B }]', 'correctIndex: 7', 'explanation: Because.', '```')

    expect(broken).toThrow(/^lesson\.md:12: quiz "q1": correctIndex: must point at one of the 2 options/)
  })

  it('rejects a block exercise whose answer needs a block it does not offer', () => {
    const broken = () =>
      lesson(
        '## Q {#q}', '', 'Text.', '',
        '```block-exercise', 'id: b1', 'prompt: Build it', 'availableBlocks: [git, add]', 'correctAnswer: [git, commit]', '```',
      )

    expect(broken).toThrow(/^lesson\.md:12: block-exercise "b1": correctAnswer: uses "commit", which availableBlocks does not offer/)
  })

  it('rejects an acceptable answer that needs a block more times than it is offered', () => {
    const broken = () =>
      lesson(
        '## Q {#q}', '', 'Text.', '',
        '```block-exercise', 'id: b1', 'prompt: Build it', 'availableBlocks: [git, add, .]', 'correctAnswer: [git, add, .]',
        'acceptableAnswers: [[git, add, ., .]]', '```',
      )

    expect(broken).toThrow(/^lesson\.md:12: block-exercise "b1": acceptableAnswers\.0: uses "\." 2 times, but availableBlocks offers it 1 time/)
  })

  describe('sandbox exercise goals', () => {
    function sandbox(...yaml: string[]) {
      return () =>
        lesson(
          '## Q {#q}', '', 'Text.', '',
          '```sandbox-exercise', 'id: s1', 'title: Try it', 'brief: Do it', 'mode: goal', 'seed: { dir: /project }',
          ...yaml,
          '```',
        )
    }

    it('rejects a goal check whose kind is misspelled, since it could never pass', () => {
      const broken = sandbox('goals:', '  - { id: g1, label: Make it, check: { kind: branch-exsts, name: x } }')

      expect(broken).toThrow(/^lesson\.md:12: sandbox-exercise "s1": goals\.0\.check/)
    })

    it('rejects a goal check nested inside all-of that is missing its fields', () => {
      const broken = sandbox('goals:', '  - { id: g1, label: Make it, check: { kind: all-of, checks: [{ kind: branch-exists }] } }')

      expect(broken).toThrow(/^lesson\.md:12: sandbox-exercise "s1": goals\.0\.check\.checks\.0\.name/)
    })

    it('rejects two goals that share an id', () => {
      const broken = sandbox(
        'goals:',
        '  - { id: g1, label: One, check: { kind: repo-initialized } }',
        '  - { id: g1, label: Two, check: { kind: working-tree-clean } }',
      )

      expect(broken).toThrow(/^lesson\.md:12: sandbox-exercise "s1": goals\.1\.id: "g1" is already used by another goal/)
    })

    it('rejects a detour that waits for a goal the exercise does not have', () => {
      const broken = sandbox(
        'goals:',
        '  - { id: g1, label: One, check: { kind: repo-initialized } }',
        'detours:',
        '  - { id: d1, untilGoal: nope, check: { kind: working-tree-clean }, message: Not yet }',
      )

      expect(broken).toThrow(/^lesson\.md:12: sandbox-exercise "s1": detours\.0\.untilGoal: no goal has the id "nope"/)
    })

    it('accepts well-formed goals and detours', () => {
      const valid = sandbox(
        'goals:',
        '  - { id: g1, label: One, check: { kind: not, check: { kind: branch-exists, name: main } } }',
        'detours:',
        '  - { id: d1, untilGoal: g1, check: { kind: last-command, startsWith: git add }, message: Not yet }',
      )

      expect(valid).not.toThrow()
    })
  })

  it('rejects text that sits outside any step', () => {
    expect(() => lesson('Stray text.')).toThrow('lesson.md:8: content must sit under a "## Title {#id}" heading')
  })
})
