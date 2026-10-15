import { Link } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { CheatsheetTrigger } from '@/components/cheatsheet/CheatsheetTrigger'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'
import { ProgressBar } from './ProgressBar'

const slot = 'w-11 lg:w-32 shrink-0 flex justify-center'

const control =
  'inline-flex items-center gap-1.5 h-11 w-11 justify-center rounded-lg no-underline ' +
  'text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors ' +
  `lg:w-auto lg:px-2 ${FOCUS_RING}`

interface LessonHeaderBarProps {
  current: number
  total: number
}

export function LessonHeaderBar({ current, total }: LessonHeaderBarProps) {
  return (
    <div className="w-full h-14 flex items-center justify-center gap-2 px-6 sm:px-8 lg:gap-3 lg:px-0">
      <div className={`${slot} lg:justify-end`}>
        <Link to="/" aria-label={messages.header.backToLessons} className={control}>
          <ArrowLeft size={16} />
          <span className="hidden lg:inline text-sm whitespace-nowrap">{messages.header.allLessons}</span>
        </Link>
      </div>

      <div className="w-full max-w-content min-w-0 min-[840px]:px-8">
        <ProgressBar current={current} total={total} />
      </div>

      <div className={`${slot} lg:justify-start`}>
        <CheatsheetTrigger label={messages.header.openCheatsheet} title={messages.header.cheatsheet} className={control}>
          <ScrollText size={16} />
          <span className="hidden lg:inline text-sm whitespace-nowrap">{messages.header.cheatsheet}</span>
        </CheatsheetTrigger>
      </div>
    </div>
  )
}
