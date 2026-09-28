import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PromptInfo, Sandbox } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals'
import { commandLocksFor } from '@/data/lessons/commandLocks'
import type { SandboxExerciseStep } from '@/types'

export type TerminalLine = {
  id: number
  kind: 'command' | 'stdout' | 'stderr'
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
  completedGoals: boolean[]
  allCompleted: boolean
  activeGoalIndex: number
  submit: (line: string) => void
  reset: () => void
}

export default function useSandboxExercise(
  step: SandboxExerciseStep,
  lessonId: number,
  previouslyCompleted: boolean,
): SandboxExerciseState {
  const sandboxRef = useRef<Sandbox | null>(null)
  const locks = useMemo(() => commandLocksFor(lessonId), [lessonId])
  const nextLineId = useRef(0)

  const [ready, setReady] = useState(false)
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [prompt, setPrompt] = useState<PromptInfo>(IDLE_PROMPT)
  const [completedGoals, setCompletedGoals] = useState<boolean[]>(() =>
    step.goals.map(() => previouslyCompleted),
  )

  /**
   * Goals latch once met. Several of them describe something the learner did
   * rather than something still true — staging stops being true the moment you
   * commit, and a file that vanished on `main` comes back when you switch away.
   */
  const refresh = useCallback(
    async (sandbox: Sandbox) => {
      const snapshot = await sandbox.snapshot()
      setPrompt(await sandbox.prompt())
      setCompletedGoals((previous) => {
        if (step.mode !== 'guided') {
          return step.goals.map((goal, index) => previous[index] || evaluateGoal(goal.check, snapshot))
        }

        const reached = [...previous]
        for (const [index, goal] of step.goals.entries()) {
          if (reached[index]) continue
          if (!evaluateGoal(goal.check, snapshot)) break
          reached[index] = true
        }
        return reached
      })
    },
    [step.goals, step.mode],
  )

  /** isomorphic-git only loads for learners who actually reach a sandbox step. */
  useEffect(() => {
    let cancelled = false

    void import('@/lib/git-sim/createSandbox')
      .then(({ createSandbox }) => createSandbox(step.seed, locks))
      .then(async (sandbox) => {
        if (cancelled) return
        sandboxRef.current = sandbox
        await refresh(sandbox)
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
      sandboxRef.current = null
    }
  }, [step.seed, locks, refresh])

  const appendLines = useCallback((entries: Omit<TerminalLine, 'id'>[]) => {
    setLines((previous) => [
      ...previous,
      ...entries.map((entry) => ({ ...entry, id: nextLineId.current++ })),
    ])
  }, [])

  const submit = useCallback(
    (line: string) => {
      const sandbox = sandboxRef.current
      if (!sandbox) return

      setRunning(true)
      appendLines([{ kind: 'command', text: line, prompt }])

      void sandbox
        .run(line)
        .then(async (result) => {
          if (result.clearScreen) setLines([])
          else {
            appendLines(
              result.outputs
                .filter((output) => output.text !== '')
                .map((output) => ({ kind: output.stream, text: output.text })),
            )
          }
          await refresh(sandbox)
        })
        .finally(() => {
          setRunning(false)
        })
    },
    [appendLines, prompt, refresh],
  )

  const reset = useCallback(() => {
    const sandbox = sandboxRef.current
    if (!sandbox) return

    setRunning(true)
    void sandbox
      .reset()
      .then(async () => {
        setLines([])
        setCompletedGoals(step.goals.map(() => false))
        await refresh(sandbox)
      })
      .finally(() => {
        setRunning(false)
      })
  }, [refresh, step.goals])

  const allCompleted = completedGoals.length > 0 && completedGoals.every(Boolean)
  const firstIncomplete = completedGoals.findIndex((done) => !done)

  return {
    ready,
    running,
    lines,
    prompt,
    completedGoals,
    allCompleted,
    activeGoalIndex: firstIncomplete === -1 ? step.goals.length - 1 : firstIncomplete,
    submit,
    reset,
  }
}
