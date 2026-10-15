import { useId, type Ref } from 'react'
import { homePathFolders } from '@/lib/file-tree/homePath'
import { WindowFrame } from '@/components/lesson/window/WindowFrame'
import { EditorActivityBar } from '@/components/lesson/editor/components/EditorActivityBar'
import { EditorBreadcrumbs } from '@/components/lesson/editor/components/EditorBreadcrumbs'
import { EditorStatusBar } from '@/components/lesson/editor/components/EditorStatusBar'
import { EditorTabs } from '@/components/lesson/editor/components/EditorTabs'
import { editorLanguage } from '@/components/lesson/editor/model/editorLanguage'
import { EditableCode } from './EditableCode'
import { messages } from '@/messages/en'

interface ConflictCodeEditorProps {
  homePath: string
  value: string
  describedById: string
  onChange: (value: string) => void
  ref?: Ref<HTMLTextAreaElement>
}

export function ConflictCodeEditor({ homePath, value, describedById, onChange, ref }: ConflictCodeEditorProps) {
  const tabId = useId()
  const [folder = '', fileName = ''] = homePathFolders(homePath).slice(-2)

  return (
    <WindowFrame
      skin="editor"
      title={`${fileName} — ${folder}`}
      sidebar={<EditorActivityBar />}
      statusBar={<EditorStatusBar language={editorLanguage(fileName)} />}
      toolbar={
        <>
          <EditorTabs tabIds={[tabId]} panelId="" fileNames={[fileName]} selected={0} onSelect={() => {}} />
          <EditorBreadcrumbs path={homePath} />
        </>
      }
      data-code-scroll
    >
      <EditableCode
        ref={ref}
        value={value}
        label={messages.sandbox.conflict.editLabel(fileName)}
        describedById={describedById}
        onChange={onChange}
      />
    </WindowFrame>
  )
}
