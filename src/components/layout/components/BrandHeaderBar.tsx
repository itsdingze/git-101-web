import { GitBranch } from 'lucide-react'
import ContentColumn from '../ContentColumn'
import GitHubStarBadge from './GitHubStarBadge'

export default function BrandHeaderBar() {
  return (
    <ContentColumn className="h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-text-primary font-semibold text-sm tracking-tight">
        <GitBranch size={18} className="text-text-muted" />
        <span>Git 101</span>
      </div>
      <GitHubStarBadge />
    </ContentColumn>
  )
}
