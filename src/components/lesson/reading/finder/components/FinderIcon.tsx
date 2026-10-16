import type { FileEntryKind } from '@/types'

export function FolderIcon({ className = 'h-13 w-16' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 52" className={className}>
      <path
        d="M4 8a4 4 0 0 1 4-4h15a3 3 0 0 1 2.1.9L29 9h27a4 4 0 0 1 4 4v33a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"
        className="fill-finder-folder"
      />
      <rect x="4" y="14" width="56" height="36" rx="4" className="fill-finder-folder-front" />
    </svg>
  )
}

export function DiskIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 30" className={className}>
      <rect x="2" y="1" width="20" height="28" className="fill-text-muted" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 44 56" className="h-14 w-11">
      <path
        d="M6 2.5h22.5L41.5 15.5V51a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 51V5A2.5 2.5 0 0 1 6 2.5z"
        className="fill-bg-primary stroke-text-muted/40"
      />
      <path d="M28.5 2.5V13a2.5 2.5 0 0 0 2.5 2.5h10.5" className="fill-bg-card stroke-text-muted/40" />
      <path d="M10 24h24M10 30h24M10 36h24M10 42h14" className="stroke-bg-elevated" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function FinderIcon({ kind }: { kind: FileEntryKind }) {
  return (
    <span className="flex h-14 w-16 items-end justify-center">
      {kind === 'folder' ? <FolderIcon /> : <DocumentIcon />}
    </span>
  )
}
