import { describe, expect, it } from 'vitest'
import { insertIndex } from './insertIndex'

const BLOCKS = [
  { left: 0, width: 40 },
  { left: 50, width: 60 },
  { left: 120, width: 40 },
]

describe('insertIndex', () => {
  it('drops before the first block whose middle is right of the pointer', () => {
    expect(insertIndex(BLOCKS, 10)).toBe(0)
    expect(insertIndex(BLOCKS, 30)).toBe(1)
    expect(insertIndex(BLOCKS, 100)).toBe(2)
  })

  it('drops at the end when the pointer is past every block', () => {
    expect(insertIndex(BLOCKS, 200)).toBe(3)
    expect(insertIndex([], 10)).toBe(0)
  })
})
