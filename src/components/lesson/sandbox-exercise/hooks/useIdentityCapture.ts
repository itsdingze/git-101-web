import { useEffect } from 'react'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { RepoSnapshot } from '@/lib/git-sim/goals/snapshot'
import { useProgressStore } from '@/stores/progressStore'
import { capturesIdentity, identityToSave } from '@/components/lesson/sandbox-exercise/model/learnerIdentity'

export function useIdentityCapture(seed: SandboxSeed, snapshot: RepoSnapshot | null): void {
  const stored = useProgressStore((s) => s.identity)
  const setIdentity = useProgressStore((s) => s.setIdentity)

  useEffect(() => {
    if (!snapshot || !capturesIdentity(seed)) return

    const identity = identityToSave(snapshot.config)
    if (!identity) return
    if (identity.name === stored?.name && identity.email === stored.email) return

    setIdentity(identity)
  }, [seed, snapshot, stored, setIdentity])
}
