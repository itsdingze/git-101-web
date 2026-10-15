import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DiffLines } from './DiffLines'

describe('conflict markers in the static editor', () => {
  it('labels both versions without offering merge actions', () => {
    const lines = [
      '<<<<<<< HEAD',
      '    # Show all tasks with reminders.',
      '=======',
      '    # Show only open tasks.',
      '>>>>>>> b91d190',
    ].map((text) => ({ text, change: 'unchanged' as const }))

    const markup = renderToStaticMarkup(createElement(DiffLines, { lines }))

    expect(markup).toContain('(Current Change)')
    expect(markup).toContain('(Incoming Change)')
    expect(markup).not.toContain('<button')
    expect(markup).not.toContain('Accept Current Change')
    expect(markup).toContain('Show all tasks with reminders.')
    expect(markup).toContain('Show only open tasks.')
  })
})
