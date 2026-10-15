import type { DiffLine, DiffLineChange } from '@/types'
import { diffRows } from '@/components/lesson/editor/model/diffRows'
import { CONFLICT_STYLES } from './conflictStyles'
import { CodeText } from './CodeText'
import { ConflictLabel } from './ConflictLabel'
import { messages } from '@/messages/en'

const ROW_STYLES: Record<DiffLineChange, string> = {
  unchanged: '',
  added: 'bg-editor-added-bg',
  removed: 'bg-editor-removed-bg',
}

const MARKERS: Record<DiffLineChange, { symbol: string; style: string; spoken?: string }> = {
  unchanged: { symbol: ' ', style: '' },
  added: { symbol: '+', style: 'text-editor-added', spoken: messages.editor.added },
  removed: { symbol: '-', style: 'text-editor-removed', spoken: messages.editor.removed },
}

interface DiffLinesProps {
  lines: readonly DiffLine[]
}

export function DiffLines({ lines }: DiffLinesProps) {
  const rows = diffRows(lines)
  const gutterWidth = `${String(Math.max(1, ...rows.map((row) => row.number ?? 0))).length}ch`

  return (
    <div className="w-max min-w-full py-1 font-mono text-xs leading-relaxed">
      {rows.map((line) => {
        const marker = MARKERS[line.change]
        return (
          <div key={line.key} className={`flex ${ROW_STYLES[line.change]}`}>
            <span
              aria-hidden
              style={{ width: gutterWidth }}
              className="box-content shrink-0 select-none pr-3 pl-4 text-right text-editor-gutter"
            >
              {line.number ?? ''}
            </span>
            <span aria-hidden className={`w-4 shrink-0 select-none ${marker.style}`}>
              {marker.symbol}
            </span>
            <span className={`flex-1 whitespace-pre pr-4 text-editor-text ${line.conflict ? CONFLICT_STYLES[line.conflict] : ''}`}>
              {marker.spoken && <span className="sr-only">{marker.spoken}: </span>}
              <CodeText text={line.text} />
              <ConflictLabel region={line.conflict} />
            </span>
          </div>
        )
      })}
    </div>
  )
}
