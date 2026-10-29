// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from './routes'
import { RouteErrorPage } from './pages/error/RouteErrorPage'

function renderAt(path: string, routeTable = routes) {
  const router = createMemoryRouter(routeTable, { initialEntries: [path] })
  render(createElement(RouterProvider, { router }))
}

function Crash(): never {
  throw new Error('page failed to render')
}

describe('pages that are not lessons', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows a styled not-found page for an unknown address, inside the app header', async () => {
    renderAt('/no-such-page')

    expect(await screen.findByRole('heading', { name: "We couldn't find that page" })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to all lessons' })).toBeTruthy()
    expect(document.title).toBe('Page not found — Git 101')
  })

  it('shows a styled error page when a page crashes', async () => {
    renderAt('/', [{ path: '/', errorElement: createElement(RouteErrorPage), Component: Crash }])

    expect(await screen.findByRole('heading', { name: 'This page stopped working' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to all lessons' })).toBeTruthy()
  })
})
