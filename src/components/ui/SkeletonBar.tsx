interface SkeletonBarProps {
  className: string
}

export function SkeletonBar({ className }: SkeletonBarProps) {
  return <span aria-hidden="true" className={`block max-w-full rounded bg-bg-card motion-safe:animate-pulse ${className}`} />
}
