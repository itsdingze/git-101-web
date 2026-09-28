import { useLessonNav } from '@/hooks/useLessonNav'
import footerAction, { type FooterAction } from '@/components/layout/footerAction'
import useDebugStore from '@/stores/debugStore'

interface LessonFooterAction extends FooterAction {
  onClick: (() => void) | undefined
}

export default function useLessonFooterAction(): LessonFooterAction {
  const nav = useLessonNav()
  const debugMode = useDebugStore((state) => state.debugMode)
  const action = footerAction(nav, debugMode)

  return {
    ...action,
    onClick: action.showContinue ? nav.onNext ?? undefined : nav.triggerCheck,
  }
}
