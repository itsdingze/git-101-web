import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import type { Sandbox, SandboxSeed } from '@/lib/git-sim/createSandbox'
import { commandLocksFor } from '@/data/lessons/commandLocks'

interface SandboxSession {
  sandboxRef: RefObject<Sandbox | null>
  ready: boolean
}

export function useSandboxSession(
  seed: SandboxSeed,
  lessonId: number,
  prepare: (sandbox: Sandbox) => Promise<() => void>,
): SandboxSession {
  const sandboxRef = useRef<Sandbox | null>(null)
  const locks = useMemo(() => commandLocksFor(lessonId), [lessonId])
  const [ready, setReady] = useState(false)

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
        setReady(true)
      })

    return () => {
      cancelled = true
      sandboxRef.current = null
    }
  }, [seed, locks, prepare])

  return { sandboxRef, ready }
}
