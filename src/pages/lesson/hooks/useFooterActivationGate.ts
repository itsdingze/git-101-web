import { useCallback, useLayoutEffect, useRef } from 'react'

const QUIET_MS = 300

export function useFooterActivationGate(actionKey: string): () => boolean {
  const blockedUntil = useRef(0)
  const lastKey = useRef(actionKey)

  useLayoutEffect(() => {
    if (lastKey.current === actionKey) return
    lastKey.current = actionKey
    blockedUntil.current = performance.now() + QUIET_MS
  }, [actionKey])

  return useCallback(() => {
    const now = performance.now()
    if (now < blockedUntil.current) return false
    blockedUntil.current = now + QUIET_MS
    return true
  }, [])
}
