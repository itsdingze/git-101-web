import { describe, expect, it } from 'vitest'
import { diffRows } from './diffRows'

const LINES = [
  { change: 'unchanged', text: 'tasks = load("tasks.txt")' },
  { change: 'removed', text: 'show(tasks)' },
  { change: 'added', text: 'show_grid(tasks)' },
  { change: 'added', text: 'show_due(tasks)' },
] as const

describe('diff rows', () => {
  it('number lines as they stand in the new file, skipping removed lines', () => {
    expect(diffRows(LINES).map((row) => row.number)).toEqual([1, null, 2, 3])
  })

  it('give every row its own key, even when lines repeat', () => {
    const rows = diffRows([...LINES, { change: 'removed', text: 'show(tasks)' }, { change: 'unchanged', text: '' }])

    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length)
  })

  it('mark each side of a conflict, reading markers the way the editor colours them', () => {
    const conflict = ['before', '<<<<<<< HEAD', 'mine', '======= ', 'theirs', '>>>>>>> feature', 'after']
    const rows = diffRows(conflict.map((text) => ({ change: 'unchanged' as const, text })))

    expect(rows.map((row) => row.conflict)).toEqual([
      null,
      'current-header',
      'current',
      null,
      'incoming',
      'incoming-header',
      null,
    ])
  })
})
