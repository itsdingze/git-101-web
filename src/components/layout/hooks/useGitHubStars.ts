import { useState, useEffect } from 'react'
import { REPO_API_URL } from '@/components/layout/repo'

const CACHE_KEY = 'gh-stars'

function readCachedStars(): number | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    return cached ? Number(cached) : null
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
      .then((data: { stargazers_count: number }) => {
        const count = data.stargazers_count
        cacheStars(count)
        setStars(count)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [stars])

  return stars
}
