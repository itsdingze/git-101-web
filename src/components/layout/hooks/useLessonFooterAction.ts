import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'
import { footerAction, type FooterAction } from '@/components/layout/footerAction'
import { useSkipChecks } from '@/components/layout/debugStore'

interface LessonFooterAction extends FooterAction {
  onClick: (() => void) | undefined
}

export function useLessonFooterAction(): LessonFooterAction {
  const nav = useLessonNav()
  const action = footerAction(nav, useSkipChecks())

  return {
    ...action,
    onClick: action.showContinue ? nav.onNext ?? undefined : nav.triggerCheck,
  }
}
