import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type DebugStore = {
  toggleUnlocked: boolean
  debugMode: boolean
  unlockToggle: () => void
  toggleDebugMode: () => void
}

const useDebugStore = create<DebugStore>()(
  persist(
    (set) => ({
      toggleUnlocked: false,
      debugMode: false,
      unlockToggle: () => set({ toggleUnlocked: true }),
      toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
    }),
    { name: 'git-101-debug' },
  ),
)

export default useDebugStore
