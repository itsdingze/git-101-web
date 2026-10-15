import { describe, expect, it } from 'vitest'
import { footerAction } from './footerAction'

const unsolved = {
  isLastStep: false,
  stepCompleted: false,
  checkDisabled: false,
  checkResult: null,
  continueLocked: false,
}

describe('footerAction', () => {
  it('offers Check answer on an unsolved step', () => {
    expect(footerAction(unsolved)).toMatchObject({ label: 'Check answer', showContinue: false, disabled: false })
  })

  it('offers an enabled Continue on an unsolved step in debug mode', () => {
    expect(footerAction({ ...unsolved, checkDisabled: true, checkResult: 'incorrect' }, true)).toMatchObject({
      label: 'Continue',
      showContinue: true,
      disabled: false,
    })
  })

  it('after a wrong answer, points back at the answer in words that fit tiles, options, and files alike', () => {
    expect(footerAction({ ...unsolved, checkResult: 'incorrect' })).toMatchObject({
      label: 'Change your answer above',
      showContinue: false,
      disabled: true,
    })
  })

  it('shows a disabled Continue while the step locks it', () => {
    expect(footerAction({ ...unsolved, continueLocked: true })).toMatchObject({
      label: 'Continue',
      showContinue: true,
      disabled: true,
    })
  })
})
