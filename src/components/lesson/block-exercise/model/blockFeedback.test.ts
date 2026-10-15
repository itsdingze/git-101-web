import { describe, expect, it } from 'vitest'
import { blockFeedback } from './blockFeedback'

const exercise = {
  correctAnswer: ['git', 'config', '--global', 'user.name', '"Your Name"'],
  acceptableAnswers: [['git', 'config', 'user.name', '"Your Name"', '--global']],
}

describe('blockFeedback', () => {
  it('says nothing for the correct answer or an accepted alternative', () => {
    expect(blockFeedback(exercise.correctAnswer, exercise)).toBeNull()
    expect(blockFeedback(['git', 'config', 'user.name', '"Your Name"', '--global'], exercise)).toBeNull()
  })

  it('names the first piece that does not belong', () => {
    expect(blockFeedback(['git', 'config', '--local', 'user.name', '"Your Name"'], exercise)).toBe(
      '`--local` doesn\'t belong in this command.',
    )
  })

  it('spots the right pieces in the wrong order', () => {
    expect(blockFeedback(['git', '--global', 'config', 'user.name', '"Your Name"'], exercise)).toBe(
      'The pieces are right. Change their order, then check the command again.',
    )
  })

  it('points at the missing last piece', () => {
    expect(blockFeedback(['git', 'config', '--global', 'user.name'], exercise)).toBe(
      'Add the piece that finishes the command.',
    )
  })

  it('says something is missing from the middle', () => {
    expect(blockFeedback(['git', 'config', 'user.name', '"Your Name"'], { correctAnswer: exercise.correctAnswer })).toBe(
      'Add the piece that goes between `config` and `user.name`.',
    )
  })

  it('reports a missing first piece', () => {
    expect(blockFeedback(['config', '--global', 'user.name', '"Your Name"'], exercise)).toBe(
      'Add the piece that starts the command.',
    )
  })

  it('explains a decoy piece with its own reason', () => {
    const withReasons = {
      ...exercise,
      decoyReasons: { '--local': '`--local` sets the name for this one project only, not every project.' },
    }

    expect(blockFeedback(['git', 'config', '--local', 'user.name', '"Your Name"'], withReasons)).toBe(
      '`--local` sets the name for this one project only, not every project.',
    )
  })

  it('explains the first decoy that has a reason, even after one without', () => {
    const withReasons = { ...exercise, decoyReasons: { set: '`git config` sets values without a `set` word.' } }

    expect(blockFeedback(['git', 'config', '--local', 'set', 'user.name', '"Your Name"'], withReasons)).toBe(
      '`git config` sets values without a `set` word.',
    )
  })

  it('explains a missing piece with its own reason', () => {
    const unstage = {
      correctAnswer: ['git', 'restore', '--staged', 'notes.txt'],
      missingReasons: { '--staged': 'Without `--staged`, `git restore` throws away your edits to the file.' },
    }

    expect(blockFeedback(['git', 'restore', 'notes.txt'], unstage)).toBe(
      'Without `--staged`, `git restore` throws away your edits to the file.',
    )
    expect(blockFeedback(['git', 'notes.txt'], unstage)).toBe(
      'Add the piece that goes between `git` and `--staged`.',
    )
  })

  it('keeps the order message when the pieces are right', () => {
    const withReasons = { ...exercise, decoyReasons: { '--local': 'Not this one.' } }

    expect(blockFeedback(['git', '--global', 'config', 'user.name', '"Your Name"'], withReasons)).toBe(
      'The pieces are right. Change their order, then check the command again.',
    )
  })
})
