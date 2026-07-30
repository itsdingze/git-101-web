import type { Branch } from '@/types'
import { LABEL_CHAR_WIDTH, LABEL_PILL_PADDING, LABEL_PILL_GAP, HEAD_LABEL } from '@/components/visualization/git-graph/constants'

const pill = 'rounded px-1.5 py-px font-mono text-[11px] font-semibold whitespace-nowrap'

function pillWidth(text: string): number {
  return text.length * LABEL_CHAR_WIDTH + LABEL_PILL_PADDING * 2
}

interface BranchLabelProps {
  branch: Branch
  isHead: boolean
  x: number
  y: number
}

export default function BranchLabel({ branch, isHead, x, y }: BranchLabelProps) {
  const width =
    pillWidth(branch.name) + (isHead ? LABEL_PILL_GAP + pillWidth(HEAD_LABEL) : 0)

  return (
    <foreignObject x={x} y={y - 11} width={Math.ceil(width)} height={22}>
      <div className="flex items-center gap-1">
        <span
          className={pill}
          style={{
            background: `color-mix(in srgb, ${branch.color} 15%, var(--color-bg-primary))`,
            color: branch.color,
          }}
        >
          {branch.name}
        </span>
        {isHead && (
          <span
            className={pill}
            style={{
              background: 'color-mix(in srgb, var(--color-accent-yellow) 15%, var(--color-bg-primary))',
              color: 'var(--color-accent-yellow)',
            }}
          >
            {HEAD_LABEL}
          </span>
        )}
      </div>
    </foreignObject>
  )
}
