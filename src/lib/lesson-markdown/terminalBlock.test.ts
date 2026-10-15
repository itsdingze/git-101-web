import { describe, expect, it } from 'vitest'
import { parseTerminalBlock } from './terminalBlock'

describe('Python comments in terminal diffs', () => {
  it('preserves source indentation and comment text instead of aligning them as lesson notes', () => {
    const block = parseTerminalBlock([
      '~/projects/todo-app (main) $ git diff',
      'diff --git a/app.py b/app.py',
      '--- a/app.py',
      '+++ b/app.py',
      '@@ -1,3 +1,3 @@',
      ' def show_tasks() -> None:',
      '-    # Show all tasks.',
      '+    # Show only open tasks.',
      '     pass',
      '~/projects/todo-app (main) $ git status  # check the files',
    ])

    expect(block.lines.slice(5, 9)).toEqual([
      { kind: 'output', text: ' def show_tasks() -> None:', note: '' },
      { kind: 'output', text: '-    # Show all tasks.', note: '' },
      { kind: 'output', text: '+    # Show only open tasks.', note: '' },
      { kind: 'output', text: '     pass', note: '' },
    ])
    expect(block.lines[9]).toMatchObject({ kind: 'command', text: 'git status', note: '  # check the files' })
  })
})
