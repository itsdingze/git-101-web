import type { Branch } from '@/components/lesson/reading/visualization/git-graph/types'
import { LABEL_CHAR_WIDTH, LABEL_COLORS, LABEL_PILL_PADDING, LABEL_PILL_GAP, HEAD_COLOR, HEAD_LABEL } from '@/components/lesson/reading/visualization/git-graph/constants'

const pill = 'rounded px-1.5 py-px font-mono text-2xs font-semibold whitespace-nowrap'

function pillWidth(text: string): number {
  return text.length * LABEL_CHAR_WIDTH + LABEL_PILL_PADDING * 2
}

interface BranchLabelProps {
  branch: Branch
  isHead: boolean
  x: number
  y: number
}

export function BranchLabel({ branch, isHead, x, y }: BranchLabelProps) {
  const width =
    pillWidth(branch.name) + (isHead ? LABEL_PILL_GAP + pillWidth(HEAD_LABEL) : 0)

  return (
    <foreignObject x={x} y={y - 11} width={Math.ceil(width)} height={22}>
      <div className="flex items-center gap-1">
        <span
          className={pill}
          style={{
            background: `color-mix(in srgb, ${branch.color} 15%, var(--color-bg-primary))`,
            color: branch.labelColor,
          }}
        >
          {branch.name}
        </span>
        {isHead && (
          <span
            className={pill}
            style={{
              background: `color-mix(in srgb, ${HEAD_COLOR} 15%, var(--color-bg-primary))`,
              color: LABEL_COLORS.head,
            }}
          >
            {HEAD_LABEL}
          </span>
        )}
      </div>
    </foreignObject>
  )
}
