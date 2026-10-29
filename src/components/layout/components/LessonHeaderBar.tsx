import { Link } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { CheatsheetTrigger } from '@/components/cheatsheet/CheatsheetTrigger'
import { Button } from '@/components/ui/Button'
import { messages } from '@/messages/en'
import { ProgressBar } from './ProgressBar'

const slot = 'w-11 lg:w-32 shrink-0 flex justify-center'

const labelledIcon = 'gap-1.5 lg:w-auto lg:px-2'

interface LessonHeaderBarProps {
  current: number
  total: number
}

export function LessonHeaderBar({ current, total }: LessonHeaderBarProps) {
  return (
    <div className="w-full h-14 flex items-center justify-center gap-2 px-6 sm:px-8 lg:gap-3 lg:px-0">
      <div className={`${slot} lg:justify-end`}>
        <Button as={Link} to="/" variant="text" size="icon" aria-label={messages.header.backToLessons} className={labelledIcon}>
          <ArrowLeft size={16} />
          <span className="hidden lg:inline text-sm whitespace-nowrap">{messages.header.allLessons}</span>
        </Button>
      </div>

      <div className="w-full max-w-content min-w-0 min-[840px]:px-8">
        <ProgressBar current={current} total={total} />
      </div>

      <div className={`${slot} lg:justify-start`}>
        <CheatsheetTrigger>
          {(open) => (
            <Button
              variant="text"
              size="icon"
              onClick={open}
              aria-haspopup="dialog"
              aria-label={messages.header.openCheatsheet}
              title={messages.header.cheatsheet}
              className={labelledIcon}
            >
              <ScrollText size={16} />
              <span className="hidden lg:inline text-sm whitespace-nowrap">{messages.header.cheatsheet}</span>
            </Button>
          )}
        </CheatsheetTrigger>
      </div>
    </div>
  )
}
