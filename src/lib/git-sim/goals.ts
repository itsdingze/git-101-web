import type { CommitSummary, RepoSnapshot } from './snapshot'

export type GoalCheck =
  | { kind: 'repo-initialized' }
  | { kind: 'files-staged'; paths: readonly string[] }
  | {
      kind: 'commit-exists'
      containing?: readonly string[]
      onBranch?: string
      messageIncludes?: string
    }
  | { kind: 'merge-commit-exists'; onBranch?: string }
  | { kind: 'branch-exists'; name: string }
  | { kind: 'branch-absent'; name: string }
  | { kind: 'on-branch'; name: string }
  | { kind: 'file-present'; path: string }
  | { kind: 'file-absent'; path: string }
  | { kind: 'working-tree-clean' }
  | { kind: 'up-to-date-with-remote'; branch: string }
  | { kind: 'pushed'; branch: string }
  | { kind: 'all-of'; checks: readonly GoalCheck[] }

function matchesCommit(
  commit: CommitSummary,
  containing: readonly string[] | undefined,
  onBranch: string | undefined,
  messageIncludes: string | undefined,
): boolean {
  if (containing && !containing.every((path) => commit.files.includes(path))) return false
  if (onBranch && !commit.branches.includes(onBranch)) return false
  if (messageIncludes && !commit.message.toLowerCase().includes(messageIncludes.toLowerCase())) {
    return false
  }
  return true
}

export function evaluateGoal(check: GoalCheck, snapshot: RepoSnapshot): boolean {
  switch (check.kind) {
    case 'repo-initialized':
      return snapshot.isRepo
    case 'files-staged':
      return check.paths.every((path) => snapshot.staged.some((change) => change.path === path))
    case 'commit-exists':
      return snapshot.commits.some((commit) =>
        matchesCommit(commit, check.containing, check.onBranch, check.messageIncludes),
      )
    case 'merge-commit-exists':
      return snapshot.commits.some(
        (commit) =>
          commit.parents.length > 1 && (!check.onBranch || commit.branches.includes(check.onBranch)),
      )
    case 'branch-exists':
      return snapshot.branches.includes(check.name)
    case 'branch-absent':
      return snapshot.isRepo && !snapshot.branches.includes(check.name)
    case 'on-branch':
      return snapshot.branch === check.name
    case 'file-present':
      return snapshot.workdirFiles.includes(check.path)
    case 'file-absent':
      return snapshot.isRepo && !snapshot.workdirFiles.includes(check.path)
    case 'working-tree-clean':
      return (
        snapshot.isRepo &&
        snapshot.staged.length === 0 &&
        snapshot.unstaged.length === 0 &&
        snapshot.untracked.length === 0
      )
    case 'up-to-date-with-remote': {
      const tracking = snapshot.tracking[check.branch]
      return tracking !== undefined && tracking.ahead === 0 && tracking.behind === 0
    }
    case 'pushed': {
      const tracking = snapshot.tracking[check.branch]
      return tracking !== undefined && tracking.ahead === 0
    }
    case 'all-of':
      return check.checks.every((nested) => evaluateGoal(nested, snapshot))
  }
}
