import { type MouseEvent, type RefObject, useEffect, useRef } from 'react'

interface ModalDialog {
  dialogRef: RefObject<HTMLDialogElement | null>
  closeOnBackdrop: (event: MouseEvent<HTMLDialogElement>) => void
}

export function useModalDialog(onClose: () => void): ModalDialog {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<Element | null>(null)

  useEffect(() => {
    openerRef.current ??= document.activeElement
    const opener = openerRef.current
    const dialog = dialogRef.current
    if (!dialog?.open) dialog?.showModal()

    const root = document.documentElement
    root.style.overflow = 'hidden'

    return () => {
      root.style.overflow = ''
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [])

  return {
    dialogRef,
    closeOnBackdrop: (event) => {
      if (event.target === event.currentTarget) onClose()
    },
  }
}
