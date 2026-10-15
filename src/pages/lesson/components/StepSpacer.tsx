import type { Ref } from 'react'

interface StepSpacerProps {
  grow: 'flex-2' | 'flex-3'
  ref?: Ref<HTMLDivElement>
}

export function StepSpacer({ grow, ref }: StepSpacerProps) {
  return <div ref={ref} className={`${grow} min-h-[min(4rem,9dvh)] sm:min-h-[min(6rem,14dvh)]`} />
}
