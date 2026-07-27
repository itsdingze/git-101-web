import type { Branch } from '@/types'

interface BranchLabelProps {
  branch: Branch
  isHead: boolean
  x: number
  y: number
}

export default function BranchLabel({ branch, isHead, x, y }: BranchLabelProps) {
  return (
    <foreignObject x={x} y={y - 11} width={1} height={22} style={{ overflow: 'visible' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span
          style={{
            padding: '1px 6px',
            borderRadius: 4,
            background: `color-mix(in srgb, ${branch.color} 15%, var(--color-bg-primary))`,
            color: branch.color,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {branch.name}
        </span>
        {isHead && (
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 4,
              background: 'color-mix(in srgb, var(--color-accent-yellow) 15%, white)',
              color: 'var(--color-accent-yellow)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            HEAD
          </span>
        )}
      </div>
    </foreignObject>
  )
}
