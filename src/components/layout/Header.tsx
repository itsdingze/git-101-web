import { Link } from 'react-router-dom'
import { GitBranch, ArrowLeft, ScrollText } from 'lucide-react'
import { useLessonNav } from '@/hooks/useLessonNav'
import ProgressBar from './components/ProgressBar'
import GitHubStarBadge from './components/GitHubStarBadge'

export default function Header() {
  const { showLessonNav, current, total } = useLessonNav()

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="w-full px-4 sm:px-8 h-14 flex items-center gap-4">
        {showLessonNav ? (
          <>
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary no-underline shrink-0
                rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-2xl">
                <ProgressBar current={current} total={total} />
              </div>
            </div>
            <Link
              to="/cheatsheet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary no-underline shrink-0
                rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              title="Cheat Sheet"
            >
              <ScrollText size={14} />
              <span className="hidden sm:inline">Cheat Sheet</span>
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 text-text-primary font-semibold text-sm tracking-tight">
              <GitBranch size={18} className="text-text-muted" />
              <span>Git 101</span>
            </div>
            <div className="flex-1" />
            <GitHubStarBadge />
          </>
        )}
      </div>
    </header>
  )
}
