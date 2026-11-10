import { messages } from '@/messages/en'

interface FinishedDrag {
  block: string
  canceled: boolean
  fromGlossary: boolean
  added: boolean
  position: number
  total: number
}

export function dropAnnouncement({ block, canceled, fromGlossary, added, position, total }: FinishedDrag): string {
  if (canceled) return messages.blocks.putBack(block)
  if (!fromGlossary) return messages.blocks.droppedAt(block, position, total)
  return added ? messages.blocks.added(block) : messages.blocks.notAdded(block)
}
