import { useId } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { useFileEditor } from '@/components/lesson/sandbox-exercise/hooks/useFileEditor'
import { useConflictEditorFocus } from '@/components/lesson/sandbox-exercise/hooks/useConflictEditorFocus'
import type { SandboxFiles } from '@/components/lesson/sandbox-exercise/model/sandboxFiles'
import { ConflictCodeEditor } from './ConflictCodeEditor'
import { messages } from '@/messages/en'

interface ConflictEditorPanelProps {
  files: SandboxFiles
  projectDir: string
  onSaved: () => void
}

export function ConflictEditorPanel({ files, projectDir, onSaved }: ConflictEditorPanelProps) {
  const { conflictFiles } = files
  const { openFile, open, edit, save, close } = useFileEditor(files.read, files.save)
  const { editorRef, openButtonRef, returnFocusOnClose } = useConflictEditorFocus(openFile?.path)
  const noteId = useId()

  function handleSave() {
    save()
    onSaved()
  }

  if (openFile) {
    return (
      <section aria-label={messages.sandbox.conflict.editing(openFile.path)} className="space-y-3">
        <ConflictCodeEditor
          ref={editorRef}
          homePath={`~/${projectDir}/${openFile.path}`}
          value={openFile.text}
          describedById={noteId}
          onChange={edit}
        />
        <div id={noteId}>
          <InlineMarkdown
            className="text-xs text-text-muted leading-relaxed"
            value={messages.sandbox.conflict.instructions}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="text"
            onClick={() => {
              returnFocusOnClose(openFile.path)
              close()
            }}
          >
            {messages.sandbox.conflict.cancel}
          </Button>
          <Button variant="filled" onClick={handleSave}>
            {messages.sandbox.conflict.save}
          </Button>
        </div>
      </section>
    )
  }

  if (conflictFiles.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {conflictFiles.map((path) => (
        <Button key={path} ref={openButtonRef(path)} variant="outlined" onClick={() => open(path)}>
          <FileText size={16} className="shrink-0" aria-hidden />
          <span>
            {messages.sandbox.conflict.open} <span className="font-mono">{path}</span>
          </span>
        </Button>
      ))}
    </div>
  )
}
