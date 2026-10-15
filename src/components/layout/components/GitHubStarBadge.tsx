import { Star } from 'lucide-react'
import { REPO_URL } from '@/components/layout/repo'
import { GitHubMark } from './GitHubMark'
import { useGitHubStars } from '@/components/layout/hooks/useGitHubStars'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'

export function GitHubStarBadge() {
  const stars = useGitHubStars()

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={messages.header.starOnGitHub(stars)}
      className={`-mr-2 flex h-11 items-center gap-1.5 px-2 text-sm text-text-muted hover:text-text-primary no-underline transition-colors
        rounded-lg hover:bg-bg-secondary ${FOCUS_RING}`}
    >
      <GitHubMark size={16} />
      {stars !== null && stars > 0 && (
        <>
          <Star size={13} fill="currentColor" />
          <span className="text-xs font-medium">{stars}</span>
        </>
      )}
    </a>
  )
}
