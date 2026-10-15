import git from 'isomorphic-git'
import type { MergeConflicts } from './mergeReport'

export function conflictsOf(error: unknown): MergeConflicts | null {
  if (!(error instanceof git.Errors.MergeConflictError)) return null
  return {
    content: error.data.bothModified,
    deletedByUs: error.data.deleteByUs,
    deletedByThem: error.data.deleteByTheirs,
  }
}
