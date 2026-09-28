import { useState } from 'react'
import { BookOpen, ExternalLink, FolderGit2 } from 'lucide-react'
import CheatsheetModal from '@/components/cheatsheet/CheatsheetModal'

const LINK_CLASS =
  'inline-flex items-center gap-1.5 text-accent-blue hover:underline rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue'

export default function CourseNextSteps() {
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)

  return (
    <div className="border border-border rounded-xl p-6 mt-12">
      <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">What To Do Next</h2>
      <ul className="space-y-3 text-sm text-text-secondary leading-relaxed">
        <li className="flex items-start gap-2.5">
          <FolderGit2 size={16} className="text-accent-green shrink-0 mt-0.5" aria-hidden />
          <span>
            Use Git on one real project this week. Commit small and often, and run <code className="whitespace-nowrap rounded bg-bg-card px-1.5 py-0.5 font-mono text-xs text-text-primary">git status</code> whenever you are unsure.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <BookOpen size={16} className="text-accent-green shrink-0 mt-0.5" aria-hidden />
          <span>
            Keep the commands close.{' '}
            <button type="button" onClick={() => setCheatsheetOpen(true)} className={`${LINK_CLASS} cursor-pointer`}>
              Open the cheat sheet
            </button>
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <ExternalLink size={16} className="text-accent-green shrink-0 mt-0.5" aria-hidden />
          <span>
            Go further with{' '}
            <a className={LINK_CLASS} href="https://docs.github.com/en/get-started" target="_blank" rel="noopener noreferrer">
              GitHub's getting-started docs
            </a>{' '}
            and the free{' '}
            <a className={LINK_CLASS} href="https://git-scm.com/book/en/v2" target="_blank" rel="noopener noreferrer">
              Pro Git book
            </a>
            .
          </span>
        </li>
      </ul>
      {cheatsheetOpen && <CheatsheetModal onClose={() => setCheatsheetOpen(false)} />}
    </div>
  )
}
