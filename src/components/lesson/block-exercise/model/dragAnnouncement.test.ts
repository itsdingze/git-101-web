import { describe, expect, it } from 'vitest'
import { dropAnnouncement } from './dragAnnouncement'

const drop = { block: 'git', canceled: false, fromGlossary: true, added: false, position: 2, total: 3 }

describe('dropAnnouncement', () => {
  it('says the block went back when the drag was cancelled', () => {
    expect(dropAnnouncement({ ...drop, canceled: true, added: true })).toBe('Put git back.')
  })

  it('says a block from the row joined the answer', () => {
    expect(dropAnnouncement({ ...drop, added: true })).toBe('Added git to your answer.')
  })

  it('says a block from the row was not added when it missed the answer', () => {
    expect(dropAnnouncement(drop)).toBe("git wasn't added. Drop it on your answer to add it.")
  })

  it('gives the new position of a block moved within the answer', () => {
    expect(dropAnnouncement({ ...drop, fromGlossary: false })).toBe('Dropped git at position 2 of 3.')
  })
})
