import type { ContentBlock } from '@/types'
import type { EditorGroup } from './editorGroups'

function sampleOf(block: ContentBlock | EditorGroup): string {
  switch (block.type) {
    case 'list':
      return block.items.join('|')
    case 'tabs':
      return block.tabs.map((tab) => tab.label).join('|')
    case 'diff':
      return block.fileName
    case 'editor':
      return block.files.map((file) => file.fileName).join('|')
    case 'terminal':
      return block.lines.map((line) => line.text).join('|')
    case 'files':
      return block.path
    default:
      return block.value
  }
}

export function blockKey(block: ContentBlock | EditorGroup, index: number): string {
  return `${index}-${block.type}-${sampleOf(block).slice(0, 32)}`
}
