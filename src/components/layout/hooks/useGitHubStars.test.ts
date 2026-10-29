// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGitHubStars } from './useGitHubStars'

function blockSessionStorage(): void {
  const blocked = () => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
}

describe('useGitHubStars', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('still shows the star count when the browser blocks site storage', async () => {
    blockSessionStorage()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ stargazers_count: 42 }))

    const { result } = renderHook(useGitHubStars)

    await waitFor(() => expect(result.current).toBe(42))
  })

  it('ignores a response without a usable star count and caches nothing', async () => {
    sessionStorage.clear()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const fetchStars = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ stargazers_count: 'lots' }))

    const { result } = renderHook(useGitHubStars)

    await waitFor(() => expect(fetchStars).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(result.current).toBeNull()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('ignores a garbage cached count and fetches a fresh one', async () => {
    sessionStorage.setItem('gh-stars', 'NaN')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ stargazers_count: 7 }))

    const { result } = renderHook(useGitHubStars)

    await waitFor(() => expect(result.current).toBe(7))
  })
})
