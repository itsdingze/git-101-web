import { describe, expect, it } from 'vitest'
import { GIT_COMMANDS } from '@/lib/git-sim/commands/git/registry'
import type { Lesson } from '@/types'
import lessons from './index'
import { commandLocksFor } from './commandLocks'

describe('lesson unlocks', () => {
  it('unlock every simulated git command in exactly one lesson', () => {
    const unlocked = lessons.flatMap((lesson) => lesson.unlocks)

    expect([...unlocked].sort()).toEqual(Object.keys(GIT_COMMANDS).sort())
  })
})

function gitCommandsIn(text: string): string[] {
  return [...text.matchAll(/\bgit ([a-z][a-z-]*)/g)]
    .map((match) => match[1] ?? '')
    .filter((name) => name in GIT_COMMANDS)
}

function recapText(lesson: Lesson): string {
  return lesson.steps
    .filter((step) => step.type === 'reading' && step.id === 'recap')
    .flatMap((step) => (step.type === 'reading' ? step.content : []))
    .map((block) => (block.type === 'code' ? block.value : ''))
    .join('\n')
}

function sandboxGuidanceText(lesson: Lesson): string {
  return lesson.steps
    .flatMap((step) => (step.type === 'sandbox-exercise' ? step.goals : []))
    .flatMap((goal) => [goal.narration ?? '', ...(goal.hints ?? [])])
    .join('\n')
}

describe.each(lessons)('lesson $id', (lesson) => {
  const locks = commandLocksFor(lesson.id)

  it('recaps only commands unlocked by now', () => {
    expect(gitCommandsIn(recapText(lesson)).filter((name) => locks.has(name))).toEqual([])
  })

  it('points its sandbox only at commands unlocked by now', () => {
    expect(gitCommandsIn(sandboxGuidanceText(lesson)).filter((name) => locks.has(name))).toEqual(
      [],
    )
  })
})

describe('commandLocksFor', () => {
  it('locks only what later lessons unlock, naming the lesson that does', () => {
    const locks = commandLocksFor(8)

    expect(locks.has('switch')).toBe(false)
    expect(locks.has('status')).toBe(false)
    expect(locks.get('merge')).toBe('Lesson 9: Merging')
    expect(locks.get('stash')).toBe('Lesson 11: Stash')
    expect(locks.get('push')).toBe('Lesson 14: Push and Pull')
  })

  it('locks nothing once every lesson is behind you', () => {
    expect(commandLocksFor(21).size).toBe(0)
  })
})
