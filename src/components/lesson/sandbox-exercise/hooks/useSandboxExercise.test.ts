// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { SandboxExerciseStep } from '@/types'
import { useSandboxExercise } from './useSandboxExercise'

const START_A_PROJECT_LESSON = 2
const SANDBOX_WAIT = { timeout: 4_000 }

const SEED: SandboxSeed = { dir: 'todo-app' }

const STEP: SandboxExerciseStep = {
  type: 'sandbox-exercise',
  id: 'practice',
  title: 'Practice',
  brief: 'Make your first repository.',
  mode: 'guided',
  seed: SEED,
  goals: [{ id: 'init', label: 'Run git init', hints: ['Run `git init`.'], check: { kind: 'repo-initialized' } }],
}

const OPENING_GOAL: unknown = expect.objectContaining({ kind: 'goal', text: 'Run git init' })

async function openSandbox() {
  const hook = renderHook(() => useSandboxExercise(STEP, SEED, START_A_PROJECT_LESSON))
  await waitFor(() => expect(hook.result.current.terminal.ready).toBe(true), SANDBOX_WAIT)
  return hook
}

afterEach(cleanup)

describe('useSandboxExercise', () => {
  it('opens with the first goal once the sandbox is ready', async () => {
    const { result } = await openSandbox()

    expect(result.current.terminal.lines).toEqual([OPENING_GOAL])
    expect(result.current.terminal.prompt.directory).toBe('~/todo-app')
    expect(result.current.allCompleted).toBe(false)
  })

  it('runs a command, prints it with the prompt it ran from, and ticks the goal it meets', async () => {
    const { result } = await openSandbox()
    const ranFrom = result.current.terminal.prompt

    act(() => result.current.terminal.submit('git init'))

    await waitFor(() => expect(result.current.allCompleted).toBe(true), SANDBOX_WAIT)
    expect(result.current.terminal.lines).toContainEqual(
      expect.objectContaining({ kind: 'command', text: 'git init', prompt: ranFrom }),
    )
    expect(result.current.terminal.prompt.branch).toBe('main')
    expect(result.current.snapshot?.isRepo).toBe(true)
  })

  it('still tells the learner the goal is met when the same line ends with clear', async () => {
    const { result } = await openSandbox()

    act(() => result.current.terminal.submit('git init && clear'))

    await waitFor(() => expect(result.current.allCompleted).toBe(true), SANDBOX_WAIT)
    await waitFor(() => expect(result.current.terminal.lines.map((line) => line.kind)).toEqual(['done', 'complete']), SANDBOX_WAIT)
  })

  it('puts the project and the goals back when the learner starts over', async () => {
    const { result } = await openSandbox()
    act(() => result.current.terminal.submit('git init'))
    await waitFor(() => expect(result.current.allCompleted).toBe(true), SANDBOX_WAIT)

    act(() => result.current.reset())

    await waitFor(() => expect(result.current.allCompleted).toBe(false), SANDBOX_WAIT)
    expect(result.current.snapshot?.isRepo).toBe(false)
    expect(result.current.terminal.lines).toEqual([OPENING_GOAL])
  })

  it('saves a file into the project and reads it back', async () => {
    const { result } = await openSandbox()

    act(() => result.current.files.save('notes.txt', 'Buy milk\n'))
    const contents = await act(() => result.current.files.read('notes.txt'))

    expect(contents).toBe('Buy milk\n')
    expect(result.current.snapshot?.workdirFiles).toContain('notes.txt')
  })

  it('completes a command from where the caret is', async () => {
    const { result } = await openSandbox()

    const completion = await act(() => result.current.terminal.complete('git ini', 7))

    expect(completion?.line).toMatch(/^git init/)
  })

  it('prints the choices under the line the learner typed', async () => {
    const { result } = await openSandbox()

    act(() => result.current.terminal.listCompletions('git c', ['commit', 'config']))

    expect(result.current.terminal.lines.slice(-2)).toEqual([
      expect.objectContaining({ kind: 'command', text: 'git c', prompt: result.current.terminal.prompt }),
      expect.objectContaining({ kind: 'stdout', text: 'commit  config' }),
    ])
  })
})
