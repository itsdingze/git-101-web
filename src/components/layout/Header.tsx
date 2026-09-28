import { useLessonNav } from '@/hooks/useLessonNav'
import LessonHeaderBar from './components/LessonHeaderBar'
import BrandHeaderBar from './components/BrandHeaderBar'
import useDebugUnlock from './hooks/useDebugUnlock'

export default function Header() {
  const { showLessonNav, current, total } = useLessonNav()
  useDebugUnlock()

  return (
    <header className="sticky top-0 z-50 w-full bg-bg-primary border-b border-border">
      {showLessonNav ? <LessonHeaderBar current={current} total={total} /> : <BrandHeaderBar />}
    </header>
  )
}
