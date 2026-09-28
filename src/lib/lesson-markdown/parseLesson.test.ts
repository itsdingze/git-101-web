import { describe, expect, it } from 'vitest'
import parseLesson from './parseLesson'

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

  it('reads a fenced code block, blank lines included, as one code block', () => {
    const { steps } = lesson('## Status {#status}', '', '```bash', 'git status', '', 'git log', '```')

    expect(steps[0]).toMatchObject({ content: [{ type: 'code', language: 'bash', value: 'git status\n\ngit log' }] })
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
      ':::tabs os',
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

  it('attaches a diagram named on the heading', () => {
    const { steps } = lesson('## What a branch is {#branches visualization=git-graph variant=branching}', '', 'Text.')

    expect(steps[0]).toMatchObject({ id: 'branches', visualization: 'git-graph', visualizationVariant: 'branching' })
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

  it('rejects text that sits outside any step', () => {
    expect(() => lesson('Stray text.')).toThrow('lesson.md:8: content must sit under a "## Title {#id}" heading')
  })
})
