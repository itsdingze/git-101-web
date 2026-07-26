import { CheckCircle } from 'lucide-react'

interface CheatsheetCommandProps {
  command: string
  description: string
  learned: boolean
}

export default function CheatsheetCommand({ command, description, learned }: CheatsheetCommandProps) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      {/* Always occupies space so the command column stays aligned across rows */}
      <span className="w-3 shrink-0">
        {learned && <CheckCircle size={12} className="text-accent-green translate-y-0.5" />}
      </span>
      <code className="text-sm font-mono text-text-primary shrink-0">
        {command}
      </code>
      <span className="text-sm text-text-muted">
        {description}
      </span>
    </div>
  )
}
