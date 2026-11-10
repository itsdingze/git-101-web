// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { focusDroppedBlock } from './handOffFocus'

function answerZone(...blocks: string[]): HTMLDivElement {
  const zone = document.createElement('div')
  zone.tabIndex = -1
  for (const block of blocks) {
    const tile = document.createElement('button')
    tile.dataset.block = block
    zone.append(tile)
  }
  document.body.append(zone)
  return zone
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('focusDroppedBlock', () => {
  it('focuses the answer tile for the block a keyboard drag dropped', () => {
    const zone = answerZone('git', '"Ada Lovelace"', 'add')

    focusDroppedBlock(zone, '"Ada Lovelace"')

    expect(document.activeElement).toBe(zone.children[1])
  })

  it('focuses the answer area when the block did not land in the answer', () => {
    const zone = answerZone('git')

    focusDroppedBlock(zone, 'add')

    expect(document.activeElement).toBe(zone)
  })

  it('leaves focus alone when it is still on a control', () => {
    const zone = answerZone('git')
    const other = document.createElement('button')
    document.body.append(other)
    other.focus()

    focusDroppedBlock(zone, 'git')

    expect(document.activeElement).toBe(other)
  })
})
