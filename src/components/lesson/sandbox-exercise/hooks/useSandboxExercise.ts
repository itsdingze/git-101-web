import { useCallback, useRef, useState } from 'react'
import type { PromptInfo, Sandbox, SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { RepoSnapshot } from '@/lib/git-sim/goals/snapshot'
import type { SandboxExerciseStep } from '@/types'
import { commandTip } from '@/components/lesson/sandbox-exercise/model/commandTip'
import { createCommandQueue } from '@/components/lesson/sandbox-exercise/model/commandQueue'
import { coachAfterClear, coachAfterCommand, openingCoach, type CoachLine } from '@/components/lesson/sandbox-exercise/model/coachLines'
import { printedEntries } from '@/components/lesson/sandbox-exercise/model/transcript'
import type { TerminalSession } from '@/components/lesson/sandbox-exercise/model/terminalSession'
import type { SandboxFiles } from '@/components/lesson/sandbox-exercise/model/sandboxFiles'
import { conflictFiles } from '@/components/lesson/sandbox-exercise/model/conflictFiles'
import { useTranscript } from './useTranscript'
import { useGoalProgress } from './useGoalProgress'
import { useSandboxSession } from './useSandboxSession'

interface SandboxExercise {
  terminal: TerminalSession
  files: SandboxFiles
  snapshot: RepoSnapshot | null
  allCompleted: boolean
  activeGoalIndex: number
  say: (coach: readonly CoachLine[]) => void
  reset: () => void
}

const IDLE_PROMPT: PromptInfo = { directory: '~', branch: null }

export function useSandboxExercise(
  step: SandboxExerciseStep,
  seed: SandboxSeed,
  lessonId: number,
): SandboxExercise {
  const promptRef = useRef<PromptInfo>(IDLE_PROMPT)
  const [queue] = useState(createCommandQueue)
  const [prompt, setPrompt] = useState<PromptInfo>(IDLE_PROMPT)
  const [snapshot, setSnapshot] = useState<RepoSnapshot | null>(null)
  const { lines, append, restart, settle } = useTranscript()
  const { allCompleted, activeGoalIndex, current, advance, startAgain } = useGoalProgress(step)

  const refresh = useCallback(
    async (sandbox: Sandbox) => {
      const latest = await sandbox.snapshot()
      promptRef.current = await sandbox.prompt()
      setPrompt(promptRef.current)
      setSnapshot(latest)
      return advance(latest)
    },
    [advance],
  )

  const prepare = useCallback(
    async (sandbox: Sandbox) => {
      const progress = await refresh(sandbox)
      return () => restart(openingCoach(step, progress.completed))
    },
    [refresh, restart, step],
  )

  const { sandboxRef, ready, failed, retried, retry } = useSandboxSession(seed, lessonId, prepare)

  const runLine = useCallback(
    async (line: string) => {
      const sandbox = sandboxRef.current
      if (!sandbox) return

      const before = current()
      const ranFrom = promptRef.current
      append([{ kind: 'command', text: line, prompt: ranFrom }])

      const result = await sandbox.run(line)
      const tip = commandTip(line, result.outputs, {
        branch: ranFrom.branch,
        folder: await sandbox.currentFolder(),
        newOnGitHubMain: await sandbox.newOnGitHub('main'),
      })
      append(printedEntries(result))

      const after = await refresh(sandbox)
      const coachAfter = result.clearScreen ? coachAfterClear : coachAfterCommand
      settle(result, {
        opening: openingCoach(step, after.completed),
        coach: coachAfter(step, before, after, tip),
      })
    },
    [sandboxRef, current, append, refresh, settle, step],
  )

  const writeFile = useCallback(
    async (path: string, contents: string) => {
      const sandbox = sandboxRef.current
      if (!sandbox) return

      const before = current()
      await sandbox.writeFile(path, contents)
      append(coachAfterCommand(step, before, await refresh(sandbox), null))
    },
    [sandboxRef, current, append, refresh, step],
  )

  const startOver = useCallback(async () => {
    const sandbox = sandboxRef.current
    if (!sandbox) return

    startAgain()
    await sandbox.reset()
    const progress = await refresh(sandbox)
    restart(openingCoach(step, progress.completed))
  }, [sandboxRef, startAgain, refresh, restart, step])

  const submit = useCallback((line: string) => queue.push(() => runLine(line)), [queue, runLine])

  const complete = useCallback(
    async (line: string, cursor: number) =>
      (await queue.request(async () => sandboxRef.current?.complete(line, cursor))) ?? null,
    [queue, sandboxRef],
  )

  const listCompletions = useCallback(
    (line: string, matches: readonly string[]) => {
      append([
        { kind: 'command', text: line, prompt: promptRef.current },
        { kind: 'stdout', text: matches.join('  ') },
      ])
    },
    [append],
  )

  const read = useCallback(
    async (path: string) => (await queue.request(async () => sandboxRef.current?.readFile(path))) ?? '',
    [queue, sandboxRef],
  )

  const save = useCallback(
    (path: string, contents: string) => queue.push(() => writeFile(path, contents)),
    [queue, writeFile],
  )

  const reset = useCallback(() => queue.replace(startOver), [queue, startOver])

  return {
    terminal: { ready, failed, retried, retry, lines, prompt, submit, complete, listCompletions },
    files: { conflictFiles: conflictFiles(snapshot), read, save },
    snapshot,
    allCompleted,
    activeGoalIndex,
    say: append,
    reset,
  }
}
