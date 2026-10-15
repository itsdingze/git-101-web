import type { Ref } from 'react'
import { diffRows } from '@/components/lesson/editor/model/diffRows'
import { CodeText } from '@/components/lesson/editor/components/CodeText'
import { ConflictLabel } from '@/components/lesson/editor/components/ConflictLabel'
import { CONFLICT_STYLES } from '@/components/lesson/editor/components/conflictStyles'

const CODE_TYPE = 'font-mono text-xs leading-relaxed whitespace-pre'

interface EditableCodeProps {
  value: string
  label: string
  describedById: string
  onChange: (value: string) => void
  ref?: Ref<HTMLTextAreaElement>
}

export function EditableCode({ value, label, describedById, onChange, ref }: EditableCodeProps) {
  const rows = diffRows(value.split('\n').map((text) => ({ change: 'unchanged' as const, text })))
  const gutterWidth = `${String(rows.length).length}ch`

  return (
    <div className="flex w-max min-w-full py-1">
      <div
        aria-hidden
        style={{ width: gutterWidth }}
        className={`box-content shrink-0 select-none pr-3 pl-4 text-right text-editor-gutter ${CODE_TYPE}`}
      >
        {rows.map((row) => (
          <div key={row.key}>{row.number}</div>
        ))}
      </div>
      <div aria-hidden className="w-4 shrink-0" />
      <div className="relative flex-1">
        <div aria-hidden className={`pr-4 text-editor-text ${CODE_TYPE}`}>
          {rows.map((row) => (
            <div key={row.key} className={row.conflict ? CONFLICT_STYLES[row.conflict] : ''}>
              <CodeText text={row.text} />
              <ConflictLabel region={row.conflict} />
            </div>
          ))}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          aria-describedby={describedById}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className={`absolute inset-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-transparent caret-editor-text outline-none selection:bg-editor-accent/40 ${CODE_TYPE}`}
        />
      </div>
    </div>
  )
}
