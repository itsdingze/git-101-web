import { blockShell } from './blockShell'

export function GlossaryPlaceholder({ block }: { block: string }) {
  return (
    <div className={`${blockShell} bg-border border border-border`}>
      <span className="invisible">{block}</span>
    </div>
  )
}
