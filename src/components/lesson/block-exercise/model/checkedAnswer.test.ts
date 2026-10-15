import { describe, expect, it } from 'vitest'
import { answerKeyOf, changedAnswer } from './checkedAnswer'

const wrong = ['git', 'comit']
const edited = ['git', 'commit']
const checked = { answer: wrong, feedback: 'Check the spelling.' }

describe('changedAnswer', () => {
  it('keeps feedback while the checked answer is unchanged', () => {
    expect(changedAnswer(checked, [...wrong])).toBe(checked)
  })

  it('drops feedback once the answer changes', () => {
    expect(changedAnswer(checked, edited)).toEqual({ answer: edited, feedback: null })
  })

  it('does not bring old feedback back when the learner returns to the checked answer', () => {
    const afterEdit = changedAnswer(checked, edited)

    expect(changedAnswer(afterEdit, wrong).feedback).toBeNull()
  })
})

describe('answerKeyOf', () => {
  it('tells apart answers that join to the same text', () => {
    expect(answerKeyOf(['git commit', '-m'])).not.toBe(answerKeyOf(['git', 'commit -m']))
  })
})
