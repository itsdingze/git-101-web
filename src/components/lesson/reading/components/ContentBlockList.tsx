import type { ContentBlock as ContentBlockType } from '@/types'
import { editorGroups } from '@/components/lesson/reading/model/editorGroups'
import { ContentBlock } from './ContentBlock'
import { blockKey } from '@/components/lesson/reading/model/blockKey'

interface ContentBlockListProps {
  blocks: readonly ContentBlockType[]
}

export function ContentBlockList({ blocks }: ContentBlockListProps) {
  return editorGroups(blocks).map((block, index) => <ContentBlock key={blockKey(block, index)} block={block} />)
}
