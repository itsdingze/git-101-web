import type { RepoSnapshot } from '@/lib/git-sim/goals/snapshot'

type ConflictSources = Pick<RepoSnapshot, 'conflictMarkerFiles' | 'mergeConflictFiles'>

export function conflictFiles(snapshot: ConflictSources | null): string[] {
  if (!snapshot) return []
  return [...new Set([...snapshot.conflictMarkerFiles, ...snapshot.mergeConflictFiles])]
}
