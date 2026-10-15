import { describe, expect, it } from 'vitest'
import type { SandboxExerciseStep, SandboxGoal } from '@/types'
import { coachAfterCommand, hintCoach, openingCoach } from './coachLines'

function goal(id: string, extra: Partial<SandboxGoal> = {}): SandboxGoal {
  return { id, label: `Label ${id}`, check: { kind: 'repo-initialized' }, ...extra }
}

function step(mode: SandboxExerciseStep['mode'], goals: SandboxGoal[]): SandboxExerciseStep {
  return { type: 'sandbox-exercise', id: 's', title: 't', brief: 'b', mode, seed: { dir: 'p' }, goals }
}

describe('openingCoach', () => {
  it('opens a guided exercise with the narration of the first goal still to do', () => {
    const guided = step('guided', [goal('a', { narration: 'Run `pwd`.' }), goal('b', { narration: 'Run `ls`.' })])

    expect(openingCoach(guided, [true, false])).toEqual([{ kind: 'goal', text: 'Run `ls`.' }])
  })

  it('opens a goal-mode exercise with every goal, ticking the ones already met', () => {
    const open = step('goal', [goal('a'), goal('b')])

    expect(openingCoach(open, [true, false])).toEqual([
      { kind: 'done', text: 'Label a' },
      { kind: 'goal', text: 'Label b' },
    ])
  })
})

describe('coachAfterCommand', () => {
  const guided = step('guided', [goal('a', { narration: 'Run `pwd`.' }), goal('b', { narration: 'Run `ls`.' })])
  const idle = { completed: [false, false], detour: null }

  it('ticks a goal the command met, then shows the next guided goal', () => {
    const after = { completed: [true, false], detour: null }

    expect(coachAfterCommand(guided, idle, after, null)).toEqual([
      { kind: 'done', text: 'Label a' },
      { kind: 'goal', text: 'Run `ls`.' },
    ])
  })

  it('ends with the completion message once the last goal is met', () => {
    const finished = { ...guided, completionMessage: 'You did it.' }
    const before = { completed: [true, false], detour: null }
    const after = { completed: [true, true], detour: null }

    expect(coachAfterCommand(finished, before, after, null)).toEqual([
      { kind: 'done', text: 'Label b' },
      { kind: 'complete', text: 'You did it.' },
    ])
  })

  it('puts a course tip about the command first', () => {
    expect(coachAfterCommand(guided, idle, idle, 'Leave out the `$`.')).toEqual([
      { kind: 'tip', text: 'Leave out the `$`.' },
    ])
  })

  it('warns once when the learner wanders onto a detour', () => {
    const detour = { id: 'd', check: { kind: 'repo-initialized' as const }, message: 'Wrong folder.' }
    const strayed = { completed: [false, false], detour }

    expect(coachAfterCommand(guided, idle, strayed, null)).toEqual([{ kind: 'warning', text: 'Wrong folder.' }])
    expect(coachAfterCommand(guided, strayed, strayed, null)).toEqual([])
  })

  it('leaves out the course tip when a detour warns about the same command', () => {
    const detour = { id: 'd', check: { kind: 'repo-initialized' as const }, message: 'Merge the other way.' }
    const strayed = { completed: [false, false], detour }

    expect(coachAfterCommand(guided, idle, strayed, 'Merge direction tip.')).toEqual([
      { kind: 'warning', text: 'Merge the other way.' },
    ])
  })
})

describe('hintCoach', () => {
  it('gives the requested hint, and keeps giving the last one after that', () => {
    const hinted = goal('a', { hints: ['First.', 'Second.'] })

    expect(hintCoach(hinted, 0)).toEqual({ kind: 'hint', text: 'First.' })
    expect(hintCoach(hinted, 5)).toEqual({ kind: 'hint', text: 'Second.' })
  })
})
