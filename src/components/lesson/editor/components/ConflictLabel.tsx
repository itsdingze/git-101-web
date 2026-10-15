import type { ConflictRegion } from '@/components/lesson/editor/model/diffRows'
import { messages } from '@/messages/en'

const LABELS: Partial<Record<ConflictRegion, string>> = {
  'current-header': messages.editor.currentChange,
  'incoming-header': messages.editor.incomingChange,
}

export function ConflictLabel({ region }: { region: ConflictRegion | null }) {
  const label = region ? LABELS[region] : undefined
  if (!label) return null
  return <span className="select-none text-editor-text/70"> {label}</span>
}
