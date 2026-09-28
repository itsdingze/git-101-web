import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import type { PromptInfo } from '@/lib/git-sim/createSandbox'
import type { TerminalLine } from '@/components/lesson/sandbox-exercise/hooks/useSandboxExercise'
import CoachLine from './CoachLine'

interface SandboxTerminalProps {
  lines: readonly TerminalLine[]
  prompt: PromptInfo
  disabled: boolean
  onSubmit: (line: string) => void
}

type ShellKind = 'command' | 'stdout' | 'stderr'

const LINE_CLASSES: Record<ShellKind, string> = {
  command: 'text-terminal-text',
  stdout: 'text-terminal-muted',
  stderr: 'text-terminal-error',
}

function isShellKind(kind: TerminalLine['kind']): kind is ShellKind {
  return kind in LINE_CLASSES
}

function PromptLabel({ prompt }: { prompt: PromptInfo }) {
  return (
    <span className="shrink-0 whitespace-nowrap">
      <span className="text-terminal-prompt">{prompt.directory}</span>
      {prompt.branch && <span className="text-terminal-branch"> ({prompt.branch})</span>}
      <span className="text-terminal-prompt"> $</span>
    </span>
  )
}

export default function SandboxTerminal({ lines, prompt, disabled, onSubmit }: SandboxTerminalProps) {
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    if (document.activeElement === inputRef.current) inputRef.current?.scrollIntoView({ block: 'nearest' })
  }, [lines])

  useEffect(() => {
    if (!disabled) inputRef.current?.focus({ preventScroll: true })
  }, [disabled])

  function revealInput() {
    inputRef.current?.focus({ preventScroll: true })
    inputRef.current?.scrollIntoView({ block: 'nearest' })
  }

  function recall(offset: number) {
    if (history.length === 0) return

    const current = historyIndex ?? history.length
    const next = Math.min(Math.max(current + offset, 0), history.length)
    setHistoryIndex(next === history.length ? null : next)
    setDraft(next === history.length ? '' : (history[next] ?? ''))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      recall(-1)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      recall(1)
      return
    }
    if (event.key !== 'Enter') return

    event.preventDefault()
    const line = draft.trim()
    if (!line) return

    setHistory((previous) => [...previous, line])
    setHistoryIndex(null)
    setDraft('')
    onSubmit(line)
  }

  return (
    <div
      className="bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden font-mono text-sm flex flex-col
        focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-terminal-text"
    >
      <div className="flex flex-row items-center gap-2 p-2 bg-terminal-bar border-b border-terminal-border shrink-0">
        <div className="w-3 h-3 rounded-full bg-terminal-close" />
        <div className="w-3 h-3 rounded-full bg-terminal-minimize" />
        <div className="w-3 h-3 rounded-full bg-terminal-maximize" />
        <span className="ml-2 text-terminal-muted text-sm">terminal</span>
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-label="Terminal output"
        onClick={revealInput}
        className="p-4 h-[min(22rem,55dvh)] overflow-y-auto space-y-1"
      >
        {lines.map((line) =>
          isShellKind(line.kind) ? (
            <div key={line.id} className="flex items-baseline gap-2">
              {line.kind === 'command' && <PromptLabel prompt={line.prompt ?? prompt} />}
              <span className={`min-w-0 whitespace-pre-wrap break-words ${LINE_CLASSES[line.kind]}`}>
                {line.text}
              </span>
            </div>
          ) : (
            <CoachLine key={line.id} kind={line.kind} text={line.text} />
          ),
        )}

        <div className="flex items-baseline gap-2">
          <PromptLabel prompt={prompt} />
          <input
            ref={inputRef}
            type="text"
            value={draft}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 scroll-mt-16 scroll-mb-24 bg-transparent text-terminal-text caret-terminal-text outline-none disabled:opacity-50"
            aria-label="Terminal command input"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </div>
  )
}
