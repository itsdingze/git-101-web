import { describe, expect, it } from 'vitest'
import type { Step } from '@/types'
import { recapCommands, recapSkills } from './lessonRecap'

const STEPS: Step[] = [
  {
    type: 'block-exercise',
    id: 'build',
    prompt: 'Build it',
    availableBlocks: ['git', 'status'],
    correctAnswer: ['git', 'status'],
  },
  {
    type: 'reading',
    id: 'recap',
    title: 'Recap',
    content: [
      { type: 'text', value: 'You can now:' },
      { type: 'list', items: ['Turn a folder into a repository', 'Read `git status`'] },
      { type: 'code', language: 'bash', value: 'git init      # start\ngit status    # look' },
    ],
  },
]

describe('recapSkills', () => {
  it('returns the first list in the recap step', () => {
    expect(recapSkills(STEPS)).toEqual(['Turn a folder into a repository', 'Read `git status`'])
  })

  it('returns nothing when a lesson has no recap', () => {
    expect(recapSkills(STEPS.slice(0, 1))).toEqual([])
  })
})

describe('recapCommands', () => {
  it('lists recap commands without comments, then built commands, once each', () => {
    expect(recapCommands(STEPS)).toEqual(['git init', 'git status'])
  })
})
