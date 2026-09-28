import { Bug } from 'lucide-react'
import useDebugStore from '@/stores/debugStore'

export default function DebugToggle() {
  const toggleUnlocked = useDebugStore((state) => state.toggleUnlocked)
  const debugMode = useDebugStore((state) => state.debugMode)
  const toggleDebugMode = useDebugStore((state) => state.toggleDebugMode)

  if (!import.meta.env.DEV && !toggleUnlocked) return null

  return (
    <button
      type="button"
      onClick={toggleDebugMode}
      aria-pressed={debugMode}
      title="Debug mode keeps Continue enabled on every step"
      className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm transition-colors hover:bg-bg-secondary
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
        ${debugMode ? 'text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'}`}
    >
      <Bug size={16} />
      <span>{debugMode ? 'Debug on' : 'Debug off'}</span>
    </button>
  )
}
