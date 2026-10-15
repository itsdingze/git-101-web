import type { Completion } from '@/lib/git-sim/input/completion'

type TabAction =
  | { type: 'none' }
  | { type: 'replace'; line: string; cursor: number }
  | { type: 'list'; matches: readonly string[] }

export function tabAction(draft: string, previousTabDraft: string | null, completion: Completion): TabAction {
  if (completion.line !== draft) return { type: 'replace', line: completion.line, cursor: completion.cursor }
  if (completion.matches.length > 1 && previousTabDraft === draft) return { type: 'list', matches: completion.matches }
  return { type: 'none' }
}
