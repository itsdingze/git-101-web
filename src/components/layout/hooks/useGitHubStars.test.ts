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
})
