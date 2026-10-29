// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MessageTemplate } from './MessageTemplate'

afterEach(cleanup)

describe('MessageTemplate', () => {
  it('renders the sentence with each named slot in its place', () => {
    const { container } = render(
      createElement(MessageTemplate, {
        template: 'Go further with {guide} and the free {book}.',
        slots: {
          guide: createElement('a', { href: '/guide' }, 'the guide'),
          book: createElement('a', { href: '/book' }, 'the book'),
        },
      }),
    )

    expect(container.textContent).toBe('Go further with the guide and the free the book.')
    expect(screen.getByRole('link', { name: 'the guide' }).getAttribute('href')).toBe('/guide')
    expect(screen.getByRole('link', { name: 'the book' }).getAttribute('href')).toBe('/book')
  })

  it('follows the slot order the sentence uses', () => {
    const { container } = render(
      createElement(MessageTemplate, {
        template: '{lesson} is done, {name}',
        slots: { name: 'Ada', lesson: createElement('strong', null, 'Branches') },
      }),
    )

    expect(container.innerHTML).toBe('<strong>Branches</strong> is done, Ada')
  })
})
