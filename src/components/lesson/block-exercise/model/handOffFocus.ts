function isEnabledButton(element: Element | null): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement && !element.disabled
}

function nearestTile(tile: HTMLElement, step: (element: Element) => Element | null): HTMLButtonElement | null {
  let sibling = step(tile)
  while (sibling && !isEnabledButton(sibling)) sibling = step(sibling)
  return sibling
}

function focusIsLost(): boolean {
  return document.activeElement === null || document.activeElement === document.body
}

export function focusDroppedBlock(zone: HTMLElement | null, block: string): void {
  if (!zone || !focusIsLost()) return
  const tiles = [...zone.querySelectorAll<HTMLElement>('[data-block]')]
  const target = tiles.find((tile) => tile.dataset.block === block) ?? zone
  target.focus()
}

export function handOffFocus(tile: HTMLElement, fallback: HTMLElement | null): void {
  if (document.activeElement !== tile) return

  const neighbour =
    nearestTile(tile, (element) => element.nextElementSibling) ??
    nearestTile(tile, (element) => element.previousElementSibling) ??
    fallback
  neighbour?.focus()
}
