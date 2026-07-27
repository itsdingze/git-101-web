import { Link } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import ProgressBar from './ProgressBar'

const slot = 'w-11 lg:w-32 shrink-0 flex justify-center'

const control =
  'inline-flex items-center gap-1.5 h-11 w-11 justify-center rounded-lg no-underline ' +
  'text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors ' +
  'lg:w-auto lg:px-2 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

interface LessonHeaderBarProps {
  current: number
  total: number
}

export default function LessonHeaderBar({ current, total }: LessonHeaderBarProps) {
  return (
    <div className="w-full h-14 flex items-center justify-center gap-2 px-6 sm:px-8 lg:gap-3 lg:px-0">
      <div className={`${slot} lg:justify-end`}>
        <Link to="/" aria-label="Back to all lessons" className={control}>
          <ArrowLeft size={16} />
          <span className="hidden lg:inline text-sm whitespace-nowrap">Back</span>
        </Link>
      </div>

      <div className="w-full max-w-content min-w-0 lg:px-8">
        <ProgressBar current={current} total={total} />
      </div>

      <div className={`${slot} lg:justify-start`}>
        <Link
          to="/cheatsheet"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the cheat sheet in a new tab"
          title="Cheat Sheet"
          className={control}
        >
          <ScrollText size={16} />
          <span className="hidden lg:inline text-sm whitespace-nowrap">Cheat Sheet</span>
        </Link>
      </div>
    </div>
  )
}
