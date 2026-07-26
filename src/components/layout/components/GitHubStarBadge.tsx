import { Github, Star } from 'lucide-react'
import useGitHubStars from '@/components/layout/hooks/useGitHubStars'

const REPO = 'itsdingze/git-101-web'

export default function GitHubStarBadge() {
  const stars = useGitHubStars()

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary no-underline transition-colors
        rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
    >
      <Github size={18} />
      {stars !== null && stars > 0 && (
        <>
          <Star size={13} fill="currentColor" />
          <span className="text-xs font-medium">{stars}</span>
        </>
      )}
    </a>
  )
}
