import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { X } from 'lucide-react'
import useProgressStore from '@/stores/progressStore'
import cheatsheet from '@/data/cheatsheet'
import CheatsheetCategory from './components/CheatsheetCategory'

interface CheatsheetModalProps {
  onClose: () => void
}

export default function CheatsheetModal({ onClose }: CheatsheetModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const completedLessons = useProgressStore((s) => s.completedLessons)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog?.open) dialog?.showModal()

    const root = document.documentElement
    root.style.overflow = 'hidden'

    return () => {
      root.style.overflow = ''
    }
  }, [])

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={closeOnBackdrop}
      aria-labelledby="cheatsheet-title"
      className="m-0 h-full max-h-full w-full max-w-full items-center justify-center
        bg-transparent p-4 open:flex backdrop:bg-text-primary/40 sm:p-6"
    >
      <div
        className="flex w-full max-w-content max-h-full flex-col overflow-hidden
          rounded-2xl border border-border bg-bg-primary shadow-xl"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border p-1.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the cheat sheet"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg
              text-text-muted transition-colors cursor-pointer
              hover:bg-bg-secondary hover:text-text-primary
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <X size={18} />
          </button>
          <h2 id="cheatsheet-title" className="text-base font-semibold text-text-primary">
            Cheat Sheet
          </h2>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby="cheatsheet-title"
          className="overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-blue"
        >
          <div className="px-6 py-6 sm:px-8">
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              Every command in the course. Ticked ones come from lessons you have finished.
            </p>

            <div className="flex flex-col gap-8">
              {cheatsheet.map((category) => (
                <CheatsheetCategory
                  key={category.name}
                  name={category.name}
                  commands={category.commands}
                  completedLessons={completedLessons}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
