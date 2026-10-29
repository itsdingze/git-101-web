import { useEffect, useId, useState } from 'react'
import type { DiffBlock } from '@/types'
import { messages } from '@/messages/en'
import { useScrollableRegion } from '@/components/lesson/reading/hooks/useScrollableRegion'
import { WindowFrame } from '@/components/lesson/window/WindowFrame'
import { editorLanguage } from './model/editorLanguage'
import { EditorActivityBar } from './components/EditorActivityBar'
import { EditorBreadcrumbs } from './components/EditorBreadcrumbs'
import { EditorStatusBar } from './components/EditorStatusBar'
import { EditorTabs } from './components/EditorTabs'
import { DiffLines } from './components/DiffLines'

interface CodeEditorProps {
  files: readonly DiffBlock[]
}

export function CodeEditor({ files }: CodeEditorProps) {
  const baseId = useId()
  const [selected, setSelected] = useState(0)
  const file = files[selected] ?? files[0]
  const fileNames = files.map((each) => each.fileName)
  const tabIds = fileNames.map((_, index) => `${baseId}-tab-${index}`)
  const panelId = `${baseId}-panel`
  const { ref, regionProps } = useScrollableRegion<HTMLDivElement>(messages.editor.contents(file?.fileName ?? ''), selected)

  useEffect(() => {
    ref.current?.scrollTo({ top: 0, left: 0 })
  }, [ref, selected])

  const panelProps =
    files.length > 1
      ? { role: 'tabpanel', id: panelId, 'aria-labelledby': tabIds[selected], tabIndex: 0 }
      : regionProps

  return (
    <figure aria-label={fileNames.join(', ')}>
      <WindowFrame
        skin="editor"
        title={`${file?.fileName ?? ''} — ${file?.folder ?? ''}`}
        sidebar={<EditorActivityBar />}
        statusBar={<EditorStatusBar language={editorLanguage(file?.fileName ?? '')} />}
        toolbar={
          <>
            <EditorTabs
              tabIds={tabIds}
              panelId={panelId}
              fileNames={fileNames}
              selected={selected}
              onSelect={setSelected}
            />
            {file && <EditorBreadcrumbs path={file.path} />}
          </>
        }
        ref={ref}
        {...panelProps}
        data-code-scroll
      >
        {file && <DiffLines lines={file.lines} />}
      </WindowFrame>
    </figure>
  )
}
