import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PromptInfo, Sandbox, SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { RepoSnapshot } from '@/lib/git-sim/goals/snapshot'
import { latchGoals } from '@/lib/git-sim/goals/goalProgress'
import { activeDetour } from '@/lib/git-sim/goals/detours'
import { commandLocksFor } from '@/data/lessons/commandLocks'
import type { SandboxExerciseStep } from '@/types'
import { commandTip } from '@/components/lesson/sandbox-exercise/commandTip'
import {
  coachAfterCommand,
  openingCoach,
  type CoachKind,
  type CoachLine,
  type CoachState,
} from '@/components/lesson/sandbox-exercise/coachLines'

export type TerminalLine = {
  id: number
  kind: 'command' | 'stdout' | 'stderr' | CoachKind
  text: string
  /** Recorded per command so scrollback keeps the branch it actually ran on. */
  prompt?: PromptInfo
}

const IDLE_PROMPT: PromptInfo = { directory: '~', branch: null }

interface SandboxExerciseState {
  ready: boolean
  running: boolean
  lines: TerminalLine[]
  prompt: PromptInfo
  snapshot: RepoSnapshot | null
  allCompleted: boolean
  activeGoalIndex: number
  submit: (line: string) => void
  say: (coach: readonly CoachLine[]) => void
  reset: () => void
}

export default function useSandboxExercise(
  step: SandboxExerciseStep,
  seed: SandboxSeed,
  lessonId: number,
): SandboxExerciseState {
  const sandboxRef = useRef<Sandbox | null>(null)
  const locks = useMemo(() => commandLocksFor(lessonId), [lessonId])
  const checks = useMemo(() => step.goals.map((goal) => goal.check), [step.goals])
  const nextLineId = useRef(0)
  const progressRef = useRef<CoachState>({ completed: step.goals.map(() => false), detour: null })

  const [ready, setReady] = useState(false)
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [prompt, setPrompt] = useState<PromptInfo>(IDLE_PROMPT)
  const [snapshot, setSnapshot] = useState<RepoSnapshot | null>(null)
  const [completedGoals, setCompletedGoals] = useState<boolean[]>(() => step.goals.map(() => false))

  /**
   * Goals latch once met. Several of them describe something the learner did
   * rather than something still true — staging stops being true the moment you
   * commit, and a file that vanished on `main` comes back when you switch away.
   */
  const refresh = useCallback(
    async (sandbox: Sandbox): Promise<CoachState> => {
      const latest = await sandbox.snapshot()
      setPrompt(await sandbox.prompt())
      setSnapshot(latest)

      const completed = latchGoals(step.mode, checks, progressRef.current.completed, latest)
      const detour = completed.every(Boolean) ? null : activeDetour(step.detours, latest)
      progressRef.current = { completed, detour }
      setCompletedGoals(completed)
      return progressRef.current
    },
    [checks, step.mode, step.detours],
  )

  const appendLines = useCallback((entries: readonly Omit<TerminalLine, 'id'>[]) => {
    setLines((previous) => [
      ...previous,
      ...entries.map((entry) => ({ ...entry, id: nextLineId.current++ })),
    ])
  }, [])

  const startOver = useCallback(
    (completed: readonly boolean[]) => {
      setLines([])
      appendLines(openingCoach(step, completed))
    },
    [appendLines, step],
  )

  /** isomorphic-git only loads for learners who actually reach a sandbox step. */
  useEffect(() => {
    let cancelled = false

    void import('@/lib/git-sim/createSandbox')
      .then(({ createSandbox }) => createSandbox(seed, locks))
      .then(async (sandbox) => {
        if (cancelled) return
        sandboxRef.current = sandbox
        const progress = await refresh(sandbox)
        if (cancelled) return
        startOver(progress.completed)
        setReady(true)
      })

    return () => {
      cancelled = true
      sandboxRef.current = null
    }
  }, [seed, locks, refresh, startOver])

  const submit = useCallback(
    (line: string) => {
      const sandbox = sandboxRef.current
      if (!sandbox) return

      const before = progressRef.current
      setRunning(true)
      appendLines([{ kind: 'command', text: line, prompt }])

      void sandbox
        .run(line)
        .then(async (result) => {
          const tip = commandTip(line, result.outputs, prompt.branch)
          if (!result.clearScreen) {
            appendLines(
              result.outputs
                .filter((output) => output.text !== '')
                .map((output) => ({ kind: output.stream, text: output.text })),
            )
          }

          const after = await refresh(sandbox)
          if (result.clearScreen) startOver(after.completed)
          else appendLines(coachAfterCommand(step, before, after, tip))
        })
        .finally(() => {
          setRunning(false)
        })
    },
    [appendLines, prompt, refresh, startOver, step],
  )

  const reset = useCallback(() => {
    const sandbox = sandboxRef.current
    if (!sandbox) return

    setRunning(true)
    progressRef.current = { completed: step.goals.map(() => false), detour: null }
    void sandbox
      .reset()
      .then(async () => {
        const progress = await refresh(sandbox)
        startOver(progress.completed)
      })
      .finally(() => {
        setRunning(false)
      })
  }, [refresh, startOver, step.goals])

  const allCompleted = completedGoals.length > 0 && completedGoals.every(Boolean)
  const firstIncomplete = completedGoals.findIndex((done) => !done)

  return {
    ready,
    running,
    lines,
    prompt,
    snapshot,
    allCompleted,
    activeGoalIndex: firstIncomplete === -1 ? step.goals.length - 1 : firstIncomplete,
    submit,
    say: appendLines,
    reset,
  }
}
