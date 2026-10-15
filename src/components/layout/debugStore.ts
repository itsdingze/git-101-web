import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SkipChecksState {
  skipChecks: boolean
  toggleSkipChecks: () => void
}

function createDebugStore() {
  return create<SkipChecksState>()(
    persist(
      (set) => ({
        skipChecks: false,
        toggleSkipChecks: () => set((state) => ({ skipChecks: !state.skipChecks })),
      }),
      { name: 'git-101-debug' },
    ),
  )
}

const debugStore = import.meta.env.DEV ? createDebugStore() : null

const CHECKS_ALWAYS_ON: SkipChecksState = { skipChecks: false, toggleSkipChecks: () => {} }

export const useSkipChecks: () => boolean = debugStore
  ? () => debugStore((state) => state.skipChecks)
  : () => false

export const useSkipChecksToggle: () => SkipChecksState = debugStore
  ? () => ({
      skipChecks: debugStore((state) => state.skipChecks),
      toggleSkipChecks: debugStore((state) => state.toggleSkipChecks),
    })
  : () => CHECKS_ALWAYS_ON
