import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import type { Sandbox, SandboxSeed } from '@/lib/git-sim/createSandbox'
import { commandLocksFor } from '@/data/lessons/commandLocks'

interface SandboxSession {
  sandboxRef: RefObject<Sandbox | null>
  ready: boolean
  failed: boolean
  retried: boolean
  retry: () => void
}

export function useSandboxSession(
  seed: SandboxSeed,
  lessonId: number,
  prepare: (sandbox: Sandbox) => Promise<() => void>,
): SandboxSession {
  const sandboxRef = useRef<Sandbox | null>(null)
  const locks = useMemo(() => commandLocksFor(lessonId), [lessonId])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    void import('@/lib/git-sim/createSandbox')
      .then(({ createSandbox }) => createSandbox(seed, locks, 'navigation-only'))
      .then(async (sandbox) => {
        if (cancelled) return
        sandboxRef.current = sandbox
        const show = await prepare(sandbox)
        if (cancelled) return
        show()
        setFailed(false)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      sandboxRef.current = null
    }
  }, [seed, locks, prepare, attempt])

  function retry() {
    setFailed(false)
    setAttempt((count) => count + 1)
  }

  return { sandboxRef, ready, failed, retried: attempt > 0, retry }
}
