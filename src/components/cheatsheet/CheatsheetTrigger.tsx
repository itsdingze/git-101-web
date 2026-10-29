import { type ReactNode, useState } from 'react'
import { CheatsheetModal } from './CheatsheetModal'

interface CheatsheetTriggerProps {
  children: (open: () => void) => ReactNode
}

export function CheatsheetTrigger({ children }: CheatsheetTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {children(() => setOpen(true))}
      {open && <CheatsheetModal onClose={() => setOpen(false)} />}
    </>
  )
}
