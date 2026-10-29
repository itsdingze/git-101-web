import { messages } from '@/messages/en'

interface EditorStatusBarProps {
  language: string
}

export function EditorStatusBar({ language }: EditorStatusBarProps) {
  return (
    <div
      aria-hidden
      className="flex h-6 shrink-0 items-center justify-end gap-4 overflow-hidden bg-editor-status px-3 font-sans text-2xs whitespace-nowrap text-editor-status-text"
    >
      <span>{messages.editor.cursorPosition}</span>
      <span>{messages.editor.encoding}</span>
      <span>{language}</span>
    </div>
  )
}
