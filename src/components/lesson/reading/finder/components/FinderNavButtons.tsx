import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { messages } from '@/messages/en'

const NAV_BUTTON =
  'flex h-6 w-7 cursor-pointer items-center justify-center rounded-md text-finder-control transition-colors duration-100 ' +
  'hover:bg-finder-control-hover active:bg-finder-control-active ' +
  'aria-disabled:cursor-default aria-disabled:text-finder-control-disabled aria-disabled:hover:bg-transparent aria-disabled:active:bg-transparent ' +
  FOCUS_RING

interface NavButtonProps {
  label: string
  Icon: LucideIcon
  enabled: boolean
  onPress: () => void
}

function NavButton({ label, Icon, enabled, onPress }: NavButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={!enabled}
      onClick={enabled ? onPress : undefined}
      className={NAV_BUTTON}
    >
      <Icon aria-hidden className="size-4.5" strokeWidth={2.25} />
    </button>
  )
}

interface FinderNavButtonsProps {
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
}

export function FinderNavButtons({ canGoBack, canGoForward, onBack, onForward }: FinderNavButtonsProps) {
  return (
    <div className="-my-1 ml-2 flex shrink-0 items-center">
      <NavButton label={messages.reading.finder.back} Icon={ChevronLeft} enabled={canGoBack} onPress={onBack} />
      <NavButton label={messages.reading.finder.forward} Icon={ChevronRight} enabled={canGoForward} onPress={onForward} />
    </div>
  )
}
