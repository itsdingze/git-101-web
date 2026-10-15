import { Files, GitBranch, Search } from 'lucide-react'

export function EditorActivityBar() {
  return (
    <div
      aria-hidden
      className="flex w-9 shrink-0 flex-col items-center gap-1 border-r border-editor-border bg-editor-chrome py-1 sm:w-12"
    >
      <span className="flex h-10 w-full items-center justify-center border-l-2 border-editor-accent text-editor-text">
        <Files size={20} strokeWidth={1.5} />
      </span>
      <span className="flex h-10 w-full items-center justify-center border-l-2 border-transparent text-editor-muted">
        <Search size={20} strokeWidth={1.5} />
      </span>
      <span className="flex h-10 w-full items-center justify-center border-l-2 border-transparent text-editor-muted">
        <GitBranch size={20} strokeWidth={1.5} />
      </span>
    </div>
  )
}
