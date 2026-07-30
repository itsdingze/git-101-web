import { CheckCircle } from 'lucide-react'

interface CheatsheetCommandProps {
  command: string
  description: string
  learned: boolean
}

export default function CheatsheetCommand({ command, description, learned }: CheatsheetCommandProps) {
  return (
    <div className="flex gap-3 py-1.5">
      {/* Always occupies space so the command column stays aligned across rows */}
      <span className="w-3 shrink-0 pt-1">
        {learned && <CheckCircle size={12} className="text-accent-green" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
        <code className="break-words text-sm font-mono text-text-primary sm:shrink-0">
          {command}
        </code>
        <span className="text-sm text-text-muted">
          {description}
        </span>
      </div>
    </div>
  )
}
