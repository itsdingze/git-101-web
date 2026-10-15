import type { ConflictRegion } from '@/components/lesson/editor/model/diffRows'

export const CONFLICT_STYLES: Record<ConflictRegion, string> = {
  'current-header': 'bg-editor-current-header',
  current: 'bg-editor-current-content',
  incoming: 'bg-editor-incoming-content',
  'incoming-header': 'bg-editor-incoming-header',
}
