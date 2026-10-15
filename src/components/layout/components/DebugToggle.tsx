import { Bug } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSkipChecksToggle } from '@/components/layout/debugStore'
import { messages } from '@/messages/en'

export function DebugToggle() {
  const { skipChecks, toggleSkipChecks } = useSkipChecksToggle()

  return (
    <Button
      variant="text"
      onClick={toggleSkipChecks}
      aria-pressed={skipChecks}
      className="aria-pressed:bg-text-secondary/12 aria-pressed:text-text-primary"
    >
      <Bug size={16} aria-hidden />
      {messages.header.skipChecks}
    </Button>
  )
}
