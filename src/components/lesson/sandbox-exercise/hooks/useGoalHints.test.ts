// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { SandboxGoal } from '@/types'
import type { CoachLine } from '@/components/lesson/sandbox-exercise/model/coachLines'
import { useGoalHints } from './useGoalHints'

const INIT: SandboxGoal = {
  id: 'init',
  label: 'Run git init',
  hints: ['Start a repository.', 'Run `git init`.'],
  check: { kind: 'repo-initialized' },
}

const COMMIT: SandboxGoal = {
  id: 'commit',
  label: 'Commit',
  hints: ['Save a snapshot.'],
  check: { kind: 'repo-initialized' },
}

function renderGoalHints(goal: SandboxGoal | undefined) {
  const say = vi.fn<(coach: readonly CoachLine[]) => void>()
  const hook = renderHook(({ goal }) => useGoalHints(goal, say), { initialProps: { goal } })
  const saidHints = () => say.mock.calls.map(([coach]) => coach.map((line) => line.text).join())
  return { ...hook, saidHints }
}

afterEach(cleanup)

describe('useGoalHints', () => {
  it('gives the next hint for the goal on each request', () => {
    const { result, saidHints } = renderGoalHints(INIT)

    act(() => result.current.showNextHint())
    act(() => result.current.showNextHint())

    expect(saidHints()).toEqual(['Start a repository.', 'Run `git init`.'])
  })

  it('starts from the first hint again for the next goal', () => {
    const { result, rerender, saidHints } = renderGoalHints(INIT)
    act(() => result.current.showNextHint())

    rerender({ goal: COMMIT })
    act(() => result.current.showNextHint())

    expect(saidHints()).toEqual(['Start a repository.', 'Save a snapshot.'])
  })

  it('starts from the first hint again after the learner starts over', () => {
    const { result, saidHints } = renderGoalHints(INIT)
    act(() => result.current.showNextHint())

    act(() => result.current.forgetHints())
    act(() => result.current.showNextHint())

    expect(saidHints()).toEqual(['Start a repository.', 'Start a repository.'])
  })

  it('stays quiet when there is no goal left', () => {
    const { result, saidHints } = renderGoalHints(undefined)

    act(() => result.current.showNextHint())

    expect(saidHints()).toEqual([])
  })
})
