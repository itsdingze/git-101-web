import { Github, Star } from 'lucide-react'
import { REPO_URL } from '@/data/repo'
import useGitHubStars from '@/components/layout/hooks/useGitHubStars'

export default function GitHubStarBadge() {
  const stars = useGitHubStars()

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Star this project on GitHub"
      className="-mr-2 flex h-11 items-center gap-1.5 px-2 text-sm text-text-muted hover:text-text-primary no-underline transition-colors
        rounded-lg hover:bg-bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
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
