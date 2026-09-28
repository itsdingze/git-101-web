import { CheckCircle, TriangleAlert } from 'lucide-react'

interface CheatsheetCommandProps {
  command: string
  description: string
  learned: boolean
  danger?: string
}

export default function CheatsheetCommand({ command, description, learned, danger }: CheatsheetCommandProps) {
  return (
    <div className="flex gap-3 py-1.5">
      {/* Always occupies space so the command column stays aligned across rows */}
      <span className="w-3 shrink-0 pt-1">
        {learned && <CheckCircle size={12} className="text-accent-green" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <code className={`break-words text-sm font-mono sm:shrink-0 ${danger ? 'text-accent-red' : 'text-text-primary'}`}>
            {command}
          </code>
          <span className="text-sm text-text-muted">
            {description}
          </span>
        </div>
        {danger && (
          <span className="flex items-start gap-1.5 text-xs text-accent-red">
            <TriangleAlert size={12} className="mt-0.5 shrink-0" aria-hidden />
            {danger}
          </span>
        )}
      </div>
    </div>
  )
}
