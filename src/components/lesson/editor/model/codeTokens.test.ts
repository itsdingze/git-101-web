import { describe, expect, it } from 'vitest'
import { codeTokens } from './codeTokens'

describe('code tokens', () => {
  it('mark the operator, the called function, and the quoted string in an assignment', () => {
    expect(codeTokens('tasks = load("tasks.txt")')).toEqual([
      { kind: 'plain', text: 'tasks ' },
      { kind: 'operator', text: '=' },
      { kind: 'plain', text: ' ' },
      { kind: 'function', text: 'load' },
      { kind: 'plain', text: '(' },
      { kind: 'string', text: '"tasks.txt"' },
      { kind: 'plain', text: ')' },
    ])
  })

  it('mark a function name with underscores only where it is called', () => {
    expect(codeTokens('due = read_due_dates(tasks)')).toEqual([
      { kind: 'plain', text: 'due ' },
      { kind: 'operator', text: '=' },
      { kind: 'plain', text: ' ' },
      { kind: 'function', text: 'read_due_dates' },
      { kind: 'plain', text: '(tasks)' },
    ])
  })

  it('leave arguments as plain text', () => {
    expect(codeTokens('show(open_tasks, reminders)')).toEqual([
      { kind: 'function', text: 'show' },
      { kind: 'plain', text: '(open_tasks, reminders)' },
    ])
  })

  it('mark whole numbers and decimals but not digits inside a name', () => {
    expect(codeTokens('limit = top(tasks2, 10, 2.5)')).toEqual([
      { kind: 'plain', text: 'limit ' },
      { kind: 'operator', text: '=' },
      { kind: 'plain', text: ' ' },
      { kind: 'function', text: 'top' },
      { kind: 'plain', text: '(tasks2, ' },
      { kind: 'number', text: '10' },
      { kind: 'plain', text: ', ' },
      { kind: 'number', text: '2.5' },
      { kind: 'plain', text: ')' },
    ])
  })

  it.each(['<<<<<<< HEAD', '=======', '>>>>>>> 86eb3049879bf8d0c888c47d21d5fede4fd4028e'])(
    'mark the conflict marker line %s as one marker',
    (line) => {
      expect(codeTokens(line)).toEqual([{ kind: 'conflict-marker', text: line }])
    },
  )

  it('leave an unterminated quote as plain text', () => {
    expect(codeTokens('say "hello')).toEqual([{ kind: 'plain', text: 'say "hello' }])
  })

  it.each(['Buy milk', '*.log', '# To-do app', 'A small to-do list app for learning Git.'])(
    'leave the prose line %s plain',
    (line) => {
      expect(codeTokens(line)).toEqual([{ kind: 'plain', text: line }])
    },
  )

  it('return no tokens for an empty line', () => {
    expect(codeTokens('')).toEqual([])
  })
})
