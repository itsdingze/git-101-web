import { BookOpen, ExternalLink, FolderGit2 } from 'lucide-react'
import { CheatsheetTrigger } from '@/components/cheatsheet/CheatsheetTrigger'
import { LINK_CLASS as INLINE_LINK_CLASS } from '@/components/ui/linkClass'
import { messages } from '@/messages/en'

const LINK_CLASS = `inline-flex items-center gap-1.5 ${INLINE_LINK_CLASS}`
const copy = messages.summary.nextSteps

export function CourseNextSteps() {
  return (
    <div className="flex flex-col gap-4 border border-border rounded-xl p-6">
      <h2 className="text-xs font-medium text-text-muted">{copy.title}</h2>
      <ul className="space-y-3 text-sm text-text-secondary leading-relaxed">
        <li className="flex items-start gap-2.5">
          <FolderGit2 size={16} className="text-accent-green shrink-0 mt-0.5" aria-hidden />
          <span>{copy.ownProject}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <BookOpen size={16} className="text-accent-green shrink-0 mt-0.5" aria-hidden />
          <span>
            {copy.lookUp}{' '}
            <CheatsheetTrigger className={LINK_CLASS}>{copy.openCheatsheet}</CheatsheetTrigger>
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <ExternalLink size={16} className="text-accent-green shrink-0 mt-0.5" aria-hidden />
          <span>
            {copy.goFurther}{' '}
            <a className={LINK_CLASS} href="https://docs.github.com/en/get-started" target="_blank" rel="noopener noreferrer">
              {copy.gettingStartedGuide}
            </a>{' '}
            {copy.andTheFree}{' '}
            <a className={LINK_CLASS} href="https://git-scm.com/book/en/v2" target="_blank" rel="noopener noreferrer">
              {copy.proGitBook}
            </a>
            .
          </span>
        </li>
      </ul>
    </div>
  )
}
