import { X } from 'lucide-react'
import { useProgressStore } from '@/stores/progressStore'
import { cheatsheet } from '@/data/cheatsheet'
import { messages } from '@/messages/en'
import { Button } from '@/components/ui/Button'
import { FOCUS_RING_INSET } from '@/components/ui/focusRing'
import { CheatsheetCategory } from './components/CheatsheetCategory'
import { useModalDialog } from './hooks/useModalDialog'

interface CheatsheetModalProps {
  onClose: () => void
}

export function CheatsheetModal({ onClose }: CheatsheetModalProps) {
  const { dialogRef, closeOnBackdrop } = useModalDialog(onClose)
  const completedLessons = useProgressStore((s) => s.completedLessons)

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
          <Button variant="text" size="icon" onClick={onClose} aria-label={messages.cheatsheet.close} className="shrink-0">
            <X size={18} />
          </Button>
          <h2 id="cheatsheet-title" className="text-base font-semibold text-text-primary">
            {messages.cheatsheet.title}
          </h2>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby="cheatsheet-title"
          className={`overflow-y-auto ${FOCUS_RING_INSET}`}
        >
          <div className="px-6 py-6 sm:px-8">
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              {messages.cheatsheet.intro}
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
