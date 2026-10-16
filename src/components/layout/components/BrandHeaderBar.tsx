import { GitBranch } from 'lucide-react'
import { ContentColumn } from '@/components/layout/ContentColumn'
import { messages } from '@/messages/en'
import { DebugToggle } from './DebugToggle'
import { GitHubStarBadge } from './GitHubStarBadge'
import { ThemeToggle } from './ThemeToggle'

export function BrandHeaderBar() {
  return (
    <ContentColumn className="h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-text-primary font-semibold text-sm tracking-tight">
        <GitBranch size={18} className="text-text-muted" />
        <span>{messages.app.name}</span>
      </div>
      <div className="flex items-center gap-1">
        {import.meta.env.DEV && <DebugToggle />}
        <ThemeToggle />
        <GitHubStarBadge />
      </div>
    </ContentColumn>
  )
}
