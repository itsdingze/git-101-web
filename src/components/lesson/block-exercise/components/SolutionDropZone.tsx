import type { ReactNode, RefObject } from 'react'
import { useDroppable } from '@dnd-kit/react'
import { Shake } from '@/components/lesson/components/Shake'

interface SolutionDropZoneProps {
  children: ReactNode
  zoneRef: RefObject<HTMLDivElement | null>
  solved: boolean
  shakeSlots: boolean
  overSolution: boolean
}

export function SolutionDropZone({ children, zoneRef, solved, shakeSlots, overSolution }: SolutionDropZoneProps) {
  useDroppable({ id: 'solution-area', element: zoneRef })

  return (
    <Shake
      ref={zoneRef}
      shaking={shakeSlots}
      className={`min-h-14 flex flex-wrap items-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed transition-colors ${
        solved
          ? 'border-accent-green/40 bg-accent-green/5'
          : shakeSlots
            ? 'border-accent-red bg-accent-red/5'
            : overSolution
              ? 'border-text-muted bg-bg-secondary'
              : 'border-border bg-bg-secondary'
      }`}
    >
      {children}
    </Shake>
  )
}
