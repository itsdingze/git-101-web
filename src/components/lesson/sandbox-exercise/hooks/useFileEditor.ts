import { useCallback, useState } from 'react'

type OpenFile = {
  path: string
  text: string
}

interface FileEditor {
  openFile: OpenFile | null
  open: (path: string) => void
  edit: (text: string) => void
  save: () => void
  close: () => void
}

export function useFileEditor(
  readFile: (path: string) => Promise<string>,
  saveFile: (path: string, contents: string) => void,
): FileEditor {
  const [openFile, setOpenFile] = useState<OpenFile | null>(null)

  const open = useCallback(
    (path: string) => {
      void readFile(path).then((text) => setOpenFile({ path, text }))
    },
    [readFile],
  )

  const edit = useCallback((text: string) => {
    setOpenFile((file) => file && { ...file, text })
  }, [])

  const save = useCallback(() => {
    if (openFile) saveFile(openFile.path, openFile.text)
    setOpenFile(null)
  }, [openFile, saveFile])

  const close = useCallback(() => setOpenFile(null), [])

  return { openFile, open, edit, save, close }
}
