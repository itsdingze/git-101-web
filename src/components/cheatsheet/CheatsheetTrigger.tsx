import { type ReactNode, useState } from 'react'
import { CheatsheetModal } from './CheatsheetModal'

interface CheatsheetTriggerProps {
  className: string
  label?: string
  title?: string
  children: ReactNode
}

export function CheatsheetTrigger({ className, label, title, children }: CheatsheetTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-haspopup="dialog"
        title={title}
        className={`${className} cursor-pointer`}
      >
        {children}
      </button>
      {open && <CheatsheetModal onClose={() => setOpen(false)} />}
    </>
  )
}
