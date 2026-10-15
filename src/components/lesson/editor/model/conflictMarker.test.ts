import { describe, expect, it } from 'vitest'
import { conflictMarker } from './conflictMarker'

describe('conflictMarker', () => {
  it.each([
    ['<<<<<<< HEAD', 'current'],
    ['<<<<<<<', 'current'],
    ['=======', 'divider'],
    ['======= ', 'divider'],
    ['>>>>>>> feature', 'incoming'],
  ])('reads %j as the %s marker', (line, marker) => {
    expect(conflictMarker(line)).toBe(marker)
  })

  it.each(['<<<<<<<< HEAD', '========', '<<<<<<<HEAD', 'a = 1', ''])('reads %j as ordinary text', (line) => {
    expect(conflictMarker(line)).toBeNull()
  })
})
