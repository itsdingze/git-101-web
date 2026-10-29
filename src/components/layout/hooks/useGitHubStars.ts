import { useState, useEffect } from 'react'
import { REPO_API_URL } from '@/components/layout/repo'

const CACHE_KEY = 'gh-stars'

function starCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function starsIn(data: unknown): number | null {
  return typeof data === 'object' && data !== null && 'stargazers_count' in data ? starCount(data.stargazers_count) : null
}

function readCachedStars(): number | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    return cached ? starCount(Number(cached)) : null
  } catch {
    return null
  }
}

function cacheStars(count: number): void {
  try {
    sessionStorage.setItem(CACHE_KEY, String(count))
  } catch {
    return
  }
}

export function useGitHubStars(): number | null {
  const [stars, setStars] = useState<number | null>(readCachedStars)

  useEffect(() => {
    if (stars !== null) return

    const controller = new AbortController()

    fetch(REPO_API_URL, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: unknown) => {
        const count = starsIn(data)
        if (count === null) return
        cacheStars(count)
        setStars(count)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [stars])

  return stars
}
