import { useId } from 'react'

const MIN_ROWS = 8

interface ConflictFileEditorProps {
  fileName: string
  value: string
  invalid: boolean
  describedById: string
  onChange: (value: string) => void
}

export default function ConflictFileEditor({
  fileName,
  value,
  invalid,
  describedById,
  onChange,
}: ConflictFileEditorProps) {
  const editorId = useId()

  return (
    <div>
      <label htmlFor={editorId} className="block text-xs text-text-muted mb-2">
        Edit <span className="font-mono">{fileName}</span> and leave no conflict markers behind
      </label>
      <textarea
        id={editorId}
        value={value}
        rows={Math.max(MIN_ROWS, value.split('\n').length)}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedById}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={`block w-full resize-y bg-code-bg rounded-xl border px-5 py-4 font-mono text-xs leading-relaxed
          text-code-text caret-code-text
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue
          ${invalid ? 'border-accent-red/60' : 'border-transparent'}`}
      />
    </div>
  )
}
