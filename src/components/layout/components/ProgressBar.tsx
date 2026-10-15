import { messages } from '@/messages/en'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0

  return (
    <div
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={messages.header.progress(current + 1, total)}
      className="w-full h-2 bg-bg-card rounded-full overflow-hidden"
    >
      <div
        className="h-full bg-accent-green rounded-full motion-safe:transition-[width] motion-safe:duration-400 motion-safe:ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
