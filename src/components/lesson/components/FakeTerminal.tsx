import { type KeyboardEvent, type Ref, useState, useRef, useEffect, useImperativeHandle } from 'react'

type HistoryEntry = {
  id: number
  command: string
  output: string
  type: 'command' | 'success' | 'error'
}

type SubmitResult = {
  correct: boolean
  hint?: string
}

interface FakeTerminalProps {
  ref?: Ref<FakeTerminalHandle>
  onSubmit: (command: string) => SubmitResult
  successOutput?: string
  disabled: boolean
  initialHistory?: HistoryEntry[]
  onInputChange?: (hasValue: boolean) => void
  onEnter?: () => void
  className?: string
}

export interface FakeTerminalHandle {
  submit: () => boolean | undefined
}

export default function FakeTerminal({ ref, onSubmit, successOutput, disabled, initialHistory = [], onInputChange, onEnter, className }: FakeTerminalProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const nextEntryId = useRef(0)

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    onInputChange?.(input.trim().length > 0)
  }, [input, onInputChange])

  function submit() {
    if (!input.trim()) return
    const command = input.trim()
    const result = onSubmit(command)

    const entry: HistoryEntry = { id: nextEntryId.current++, command, output: '', type: 'command' }

    if (result.correct) {
      entry.output = successOutput || 'Command executed successfully.'
      entry.type = 'success'
    } else {
      entry.output = result.hint || "That's not quite it. Give it another try."
      entry.type = 'error'
    }

    setHistory((prev) => [...prev, entry])
    setInput('')
    return result.correct
  }

  useImperativeHandle(ref, () => ({ submit }))

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      if (onEnter) onEnter()
      else submit()
    }
  }

  return (
    <div
      className={`bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden font-mono text-sm flex flex-col
        focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-terminal-text ${className || ''}`}
    >
      {/* Terminal Buttons */}
      <div className="flex flex-row items-center gap-2 p-2 bg-terminal-bar border-b border-terminal-border shrink-0">
        <div className="w-3 h-3 rounded-full bg-terminal-close" />
        <div className="w-3 h-3 rounded-full bg-terminal-minimize" />
        <div className="w-3 h-3 rounded-full bg-terminal-maximize" />
        <span className="ml-2 text-terminal-muted text-sm">terminal</span>
      </div>

      <div ref={terminalRef} className="p-4 h-[min(16rem,45dvh)] overflow-y-auto space-y-1">
        {history.map((entry) => (
          <div key={entry.id}>
            <div className="flex items-baseline gap-2">
              <span className="text-terminal-prompt">$</span>
              <span className="min-w-0 break-words text-terminal-text">{entry.command}</span>
            </div>
            {entry.output && (
              <div
                className={`ml-4 mt-0.5 whitespace-pre-wrap break-words ${
                  entry.type === 'success' ? 'text-terminal-muted' : 'text-terminal-error'
                }`}
              >
                {entry.output}
              </div>
            )}
          </div>
        ))}

        {!disabled && (
          <div className="flex items-baseline gap-2">
            <span className="text-terminal-prompt">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-7 min-w-0 flex-1 bg-transparent text-terminal-text caret-terminal-text outline-none"
              aria-label="Git command input"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
        )}
      </div>
    </div>
  )
}
