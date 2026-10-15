import { describe, expect, it } from 'vitest'
import { tabKeyTarget } from './tabKeys'

describe('tabKeyTarget', () => {
  it('moves right and left, wrapping at the ends', () => {
    expect(tabKeyTarget('ArrowRight', 0, 3)).toBe(1)
    expect(tabKeyTarget('ArrowRight', 2, 3)).toBe(0)
    expect(tabKeyTarget('ArrowLeft', 0, 3)).toBe(2)
  })

  it('jumps to the first tab with Home and the last with End', () => {
    expect(tabKeyTarget('Home', 2, 3)).toBe(0)
    expect(tabKeyTarget('End', 0, 3)).toBe(2)
  })

  it('ignores other keys', () => {
    expect(tabKeyTarget('Enter', 1, 3)).toBeNull()
  })
})
