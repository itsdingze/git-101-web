import { ChevronRight, FileText } from 'lucide-react'
import { homePathFolders } from '@/lib/file-tree/homePath'
import { TruncatedPath } from '@/components/lesson/components/TruncatedPath'

interface EditorBreadcrumbsProps {
  path: string
}

export function EditorBreadcrumbs({ path }: EditorBreadcrumbsProps) {
  const names = homePathFolders(path)
  const fileIndex = names.length - 1

  return (
    <TruncatedPath className="shrink-0 bg-editor-bg px-4 pt-1 font-sans text-xs leading-5.5 text-editor-muted">
      {names.map((name, index) => (
        <li key={names.slice(0, index + 1).join('/')} className="inline">
          {index > 0 && (
            <ChevronRight aria-hidden size={12} strokeWidth={1.5} className="mx-1 inline-block align-[-1px]" />
          )}
          {index === fileIndex && (
            <FileText aria-hidden size={14} className="mr-1.5 inline-block align-[-3px] text-editor-operator" />
          )}
          {name}
        </li>
      ))}
    </TruncatedPath>
  )
}
