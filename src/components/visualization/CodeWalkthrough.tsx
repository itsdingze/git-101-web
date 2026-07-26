import { type KeyboardEvent, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type WalkthroughLineKind =
  | 'normal'
  | 'header'
  | 'added'
  | 'removed'
  | 'staged'
  | 'unstaged'
  | 'ours'
  | 'theirs'
  | 'marker-ours'
  | 'marker-theirs'

export type WalkthroughLine = { text: string; kind: WalkthroughLineKind }

export type WalkthroughStage = {
  label: string
  command?: string
  lines: WalkthroughLine[]
}

const LINE_CLASSES: Record<WalkthroughLineKind, string> = {
  normal: 'text-code-text',
  header: 'text-code-muted',
  added: 'bg-accent-green/20 text-code-text',
  removed: 'bg-accent-red/20 text-code-text',
  staged: 'bg-accent-green/20 text-code-text',
  unstaged: 'bg-accent-red/20 text-code-text',
  ours: 'bg-accent-green/20 text-code-text',
  theirs: 'bg-accent-blue/20 text-code-text',
  'marker-ours': 'bg-accent-green/40 text-code-text',
  'marker-theirs': 'bg-accent-blue/40 text-code-text',
}

interface CodeWalkthroughProps {
  stages: WalkthroughStage[]
  filename: string
}

export default function CodeWalkthrough({ stages, filename }: CodeWalkthroughProps) {
  const [stageIndex, setStageIndex] = useState(0)

  // Every stage renders the same number of rows so lines don't jump between steps
  const maxLines = Math.max(0, ...stages.map((s) => s.lines.length))
  const stage = stages[stageIndex]
  const atStart = stageIndex === 0
  const atEnd = stageIndex === stages.length - 1

  function goBackward() {
    setStageIndex((s) => Math.max(s - 1, 0))
  }

  function goForward() {
    setStageIndex((s) => Math.min(s + 1, stages.length - 1))
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' && !atStart) {
      e.preventDefault()
      goBackward()
    } else if (e.key === 'ArrowRight' && !atEnd) {
      e.preventDefault()
      goForward()
    }
  }

  if (!stage) return null

  const statusDisplay = stage.command ? (
    <span className="text-text-primary font-mono text-sm">$ {stage.command}</span>
  ) : (
    <span className="text-text-muted italic text-sm">{stage.label}</span>
  )

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded bg-bg-secondary font-mono text-text-secondary">
          {filename}
        </span>
        <span className="text-text-muted">{stage.label}</span>
      </div>

      <div className="bg-code-bg rounded-xl px-4 py-3 font-mono text-xs leading-relaxed">
        {Array.from({ length: maxLines }, (_, i) => {
          const line = stage.lines[i]
          // Blank rows fall back to a non-breaking space so they keep full height
          return (
            <div key={i} className={`px-2 py-0.75 ${line ? LINE_CLASSES[line.kind] : ''}`}>
              {line?.text || ' '}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2" onKeyDown={handleKeyDown}>
        <button
          onClick={goBackward}
          disabled={atStart}
          aria-label="Previous step"
          className="p-1.5 rounded-md border border-border text-text-secondary
            enabled:hover:bg-bg-card enabled:cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
            transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 text-center truncate">{statusDisplay}</div>

        <button
          onClick={goForward}
          disabled={atEnd}
          aria-label="Next step"
          className="p-1.5 rounded-md border border-border text-text-secondary
            enabled:hover:bg-bg-card enabled:cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
            transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
