import type { CollapseBoundary } from '@/lib/git-sim/fs/untrackedFolders'

export type UntrackedFilesMode = 'normal' | 'all' | 'no'

export type StatusView = {
  ignoredEntries: readonly string[]
  inScope: (path: string) => boolean
  collapseBoundary: CollapseBoundary
  untrackedFiles: UntrackedFilesMode
}

export const WHOLE_TREE_VIEW: StatusView = {
  ignoredEntries: [],
  inScope: () => true,
  collapseBoundary: () => '',
  untrackedFiles: 'normal',
}
