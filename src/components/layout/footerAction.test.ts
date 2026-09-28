import { describe, expect, it } from 'vitest'
import footerAction from './footerAction'

const unsolved = {
  isLastStep: false,
  stepCompleted: false,
  checkDisabled: false,
  checkResult: null,
  continueLocked: false,
}

describe('footerAction', () => {
  it('offers Check Answer on an unsolved step', () => {
    expect(footerAction(unsolved)).toMatchObject({ label: 'Check Answer', showContinue: false, disabled: false })
  })

  it('offers an enabled Continue on an unsolved step in debug mode', () => {
    expect(footerAction({ ...unsolved, checkDisabled: true, checkResult: 'incorrect' }, true)).toMatchObject({
      label: 'Continue',
      showContinue: true,
      disabled: false,
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
