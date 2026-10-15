import { useMemo } from 'react'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'
import { useProgressStore } from '@/stores/progressStore'
import { seedWithIdentity } from '@/components/lesson/sandbox-exercise/model/learnerIdentity'

export function useExerciseSeed(seed: SandboxSeed): SandboxSeed {
  const name = useProgressStore((s) => s.identity?.name)
  const email = useProgressStore((s) => s.identity?.email)

  return useMemo(
    () => seedWithIdentity(seed, name !== undefined && email !== undefined ? { name, email } : null),
    [seed, name, email],
  )
}
