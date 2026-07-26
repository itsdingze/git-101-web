import { type KeyboardEvent, type Ref, useState, useRef, useEffect, useImperativeHandle } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

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

let nextEntryId = 0

export default function FakeTerminal({ ref, onSubmit, successOutput, disabled, initialHistory = [], onInputChange, onEnter, className }: FakeTerminalProps) {
  const prefersReduced = useReducedMotion()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

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

    const entry: HistoryEntry = { id: nextEntryId++, command, output: '', type: 'command' }

    if (result.correct) {
      entry.output = successOutput || 'Command executed successfully.'
      entry.type = 'success'
    } else {
      entry.output = result.hint || "That's not quite it — give it another try."
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

      <div ref={terminalRef} className="p-4 h-64 overflow-y-auto space-y-1">
        {history.map((entry) => (
          <div key={entry.id}>
            <div className="flex items-center gap-2">
              <span className="text-terminal-prompt">$</span>
              <span className="text-terminal-text">{entry.command}</span>
            </div>
            {entry.output && (
              <div
                className={`ml-4 mt-0.5 whitespace-pre-wrap ${
                  entry.type === 'success' ? 'text-terminal-muted' : 'text-terminal-error'
                }`}
              >
                {entry.output}
              </div>
            )}
          </div>
        ))}

        {!disabled && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-prompt">$</span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-terminal-text outline-none caret-transparent"
                aria-label="Git command input"
                spellCheck={false}
                autoComplete="off"
              />
              <motion.span
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4.5 bg-terminal-text/80"
                style={{ left: `${input.length * 0.6}em` }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: [1, 0] }}
                transition={prefersReduced ? undefined : { duration: 0.53, repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
