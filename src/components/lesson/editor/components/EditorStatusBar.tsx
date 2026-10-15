interface EditorStatusBarProps {
  language: string
}

export function EditorStatusBar({ language }: EditorStatusBarProps) {
  return (
    <div
      aria-hidden
      className="flex h-6 shrink-0 items-center justify-end gap-4 overflow-hidden bg-editor-status px-3 font-sans text-2xs whitespace-nowrap text-editor-status-text"
    >
      <span>Ln 1, Col 1</span>
      <span>UTF-8</span>
      <span>{language}</span>
    </div>
  )
}
