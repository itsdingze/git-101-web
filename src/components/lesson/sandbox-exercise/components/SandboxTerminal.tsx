import { useEffect, useRef } from 'react'
import type { PromptInfo } from '@/lib/git-sim/createSandbox'
import type { TerminalLine } from '@/components/lesson/sandbox-exercise/model/transcript'
import type { TerminalSession } from '@/components/lesson/sandbox-exercise/model/terminalSession'
import { useTerminalInput } from '@/components/lesson/sandbox-exercise/hooks/useTerminalInput'
import { PromptLabel } from '@/components/lesson/terminal/PromptLabel'
import { TerminalFrame } from '@/components/lesson/terminal/TerminalFrame'
import { CoachMessage } from './CoachMessage'
import { TerminalKeyRow } from './TerminalKeyRow'
import { messages } from '@/messages/en'

interface SandboxTerminalProps {
  session: TerminalSession
  focusRequest: number
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

interface ShellLineProps {
  kind: ShellKind
  text: string
  prompt: PromptInfo
}

function ShellLine({ kind, text, prompt }: ShellLineProps) {
  if (kind === 'command') {
    return (
      <div className={LINE_CLASSES.command}>
        <PromptLabel prompt={prompt} /> {text}
      </div>
    )
  }

  return <div className={LINE_CLASSES[kind]}>{text}</div>
}

export function SandboxTerminal({ session, focusRequest }: SandboxTerminalProps) {
  const { lines, prompt, ready } = session
  const { inputRef, draft, setDraft, handleKeyDown, pressTouchKey } = useTerminalInput(session)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, left: 0 })
    if (document.activeElement === inputRef.current) inputRef.current?.scrollIntoView({ block: 'nearest' })
  }, [lines, inputRef])

  const firstLineId = lines[0]?.id

  useEffect(() => {
    if (ready) inputRef.current?.focus({ preventScroll: true })
  }, [ready, firstLineId, focusRequest, inputRef])

  function revealInput() {
    inputRef.current?.focus({ preventScroll: true })
    inputRef.current?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="flex flex-col gap-2">
      <TerminalFrame title={messages.sandbox.windowTitle} ref={scrollRef} onClick={revealInput}>
        <div role="log" aria-label={messages.sandbox.output}aria-busy={!ready} className="space-y-1">
          {lines.map((line) =>
            isShellKind(line.kind) ? (
              <ShellLine key={line.id} kind={line.kind} text={line.text} prompt={line.prompt ?? prompt} />
            ) : (
              <div key={line.id} className="py-2">
                <CoachMessage kind={line.kind} text={line.text} />
              </div>
            ),
          )}
        </div>

        {ready ? (
          <div className="flex items-baseline gap-2">
            <PromptLabel prompt={prompt} />
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              className="min-w-0 flex-1 scroll-mt-16 scroll-mb-24 bg-transparent text-terminal-text caret-terminal-text outline-none"
              aria-label={messages.sandbox.input}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
        ) : (
          <p className="font-sans text-terminal-muted">{messages.sandbox.settingUp}</p>
        )}
      </TerminalFrame>

      {ready && (
        <TerminalKeyRow
          onComplete={() => pressTouchKey('complete')}
          onPrevious={() => pressTouchKey('previous')}
          onNext={() => pressTouchKey('next')}
        />
      )}
    </div>
  )
}
