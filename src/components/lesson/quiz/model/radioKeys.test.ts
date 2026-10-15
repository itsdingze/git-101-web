import { describe, expect, it } from 'vitest'
import { radioKeyTarget } from './radioKeys'

describe('radioKeyTarget', () => {
  it.each([
    ['ArrowDown', 0, 1],
    ['ArrowRight', 1, 2],
    ['ArrowDown', 3, 0],
    ['ArrowUp', 1, 0],
    ['ArrowLeft', 0, 3],
    ['Home', 2, 0],
    ['End', 0, 3],
  ])('moves with %s from option %i to option %i of four', (key, from, to) => {
    expect(radioKeyTarget(key, from, 4)).toBe(to)
  })

  it('ignores other keys', () => {
    expect(radioKeyTarget('Enter', 0, 4)).toBeNull()
  })
})
