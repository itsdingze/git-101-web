type BlockBounds = {
  left: number
  width: number
}

export function insertIndex(blocks: readonly BlockBounds[], pointerX: number): number {
  const index = blocks.findIndex((block) => pointerX < block.left + block.width / 2)
  return index === -1 ? blocks.length : index
}
