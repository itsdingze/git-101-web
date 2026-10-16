import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useThemeChoice } from '@/components/layout/hooks/useThemeChoice'
import type { ThemeChoice } from '@/stores/themeStore'
import { messages } from '@/messages/en'

const OPTIONS: readonly { choice: ThemeChoice; Icon: LucideIcon }[] = [
  { choice: 'system', Icon: Monitor },
  { choice: 'light', Icon: Sun },
  { choice: 'dark', Icon: Moon },
]

export function ThemeToggle() {
  const [current, choose] = useThemeChoice()

  return (
    <div role="group" aria-label={messages.header.theme} className="flex">
      {OPTIONS.map(({ choice, Icon }) => (
        <Button
          key={choice}
          variant="text"
          size="icon"
          onClick={() => choose(choice)}
          aria-pressed={current === choice}
          aria-label={messages.header.themeChoice[choice]}
          title={messages.header.themeChoice[choice]}
          className="aria-pressed:bg-text-secondary/12 aria-pressed:text-text-primary"
        >
          <Icon size={16} aria-hidden />
        </Button>
      ))}
    </div>
  )
}
