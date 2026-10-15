import type { ContentBlock, DiffBlock } from '@/types'

export type EditorGroup = {
  type: 'editor'
  files: DiffBlock[]
}

type GroupedBlock<B extends ContentBlock> = Exclude<B, DiffBlock> | EditorGroup

function isNotDiff<B extends ContentBlock>(block: B): block is Exclude<B, DiffBlock> {
  return block.type !== 'diff'
}

function addFile<B extends ContentBlock>(grouped: GroupedBlock<B>[], file: DiffBlock): void {
  const last = grouped[grouped.length - 1]
  if (last?.type === 'editor') last.files.push(file)
  else grouped.push({ type: 'editor', files: [file] })
}

export function editorGroups<B extends ContentBlock>(blocks: readonly B[]): GroupedBlock<B>[] {
  const grouped: GroupedBlock<B>[] = []
  for (const block of blocks) {
    if (isNotDiff(block)) grouped.push(block)
    else if (block.type === 'diff') addFile(grouped, block)
  }
  return grouped
}
