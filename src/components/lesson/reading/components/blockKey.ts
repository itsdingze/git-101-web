import type { ContentBlock } from '@/types'

function sampleOf(block: ContentBlock): string {
  switch (block.type) {
    case 'list':
      return block.items.join('|')
    case 'tabs':
      return block.tabs.map((tab) => tab.label).join('|')
    default:
      return block.value
  }
}

export default function blockKey(block: ContentBlock, index: number): string {
  return `${index}-${block.type}-${sampleOf(block).slice(0, 32)}`
}
