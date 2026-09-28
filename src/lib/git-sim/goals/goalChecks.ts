import type { CommitSummary, RepoSnapshot } from './snapshot'

export type GoalCheck =
  | { kind: 'repo-initialized' }
  | { kind: 'repo-above-project' }
  | { kind: 'no-conflict-markers' }
  | { kind: 'markers-committed' }
  | { kind: 'files-staged'; paths: readonly string[] }
  | {
      kind: 'commit-exists'
      containing?: readonly string[]
      modifies?: readonly string[]
      onBranch?: string
      messageIncludes?: string
    }
  | { kind: 'merge-commit-exists'; onBranch?: string }
  | { kind: 'merge-in-progress' }
  | { kind: 'branch-exists'; name: string }
  | { kind: 'branch-absent'; name: string }
  | { kind: 'on-branch'; name: string }
  | { kind: 'file-present'; path: string }
  | { kind: 'file-absent'; path: string }
  | { kind: 'file-line-count'; path: string; atLeast: number }
  | { kind: 'working-tree-clean' }
  | { kind: 'up-to-date-with-remote'; branch: string }
  | { kind: 'pushed'; branch: string }
  | { kind: 'upstream-set'; branch: string }
  | { kind: 'clone-exists'; path: string }
  | { kind: 'stash-count'; count: number }
  | { kind: 'stash-empty' }
  | { kind: 'head-message'; includes: string }
  | { kind: 'file-ignored'; path: string }
  | { kind: 'file-tracked'; path: string }
  | { kind: 'file-untracked'; path: string }
  | { kind: 'commit-count'; count: number }
  | { kind: 'config-set'; key: string }
  | { kind: 'config-equals'; key: string; value: string }
  | { kind: 'not'; check: GoalCheck }
  | { kind: 'all-of'; checks: readonly GoalCheck[] }
  | { kind: 'any-of'; checks: readonly GoalCheck[] }

type GoalOfKind<K extends GoalCheck['kind']> = Extract<GoalCheck, { kind: K }>

type LeafGoal = Exclude<GoalCheck, GoalOfKind<'all-of' | 'any-of' | 'not'>>

type BranchGoal = GoalOfKind<
  'repo-initialized' | 'repo-above-project' | 'branch-exists' | 'branch-absent' | 'on-branch'
>

type WorkingTreeGoal = GoalOfKind<
  | 'no-conflict-markers'
  | 'files-staged'
  | 'working-tree-clean'
  | 'file-present'
  | 'file-absent'
  | 'file-line-count'
  | 'file-ignored'
  | 'file-tracked'
  | 'file-untracked'
>

type HistoryGoal = GoalOfKind<
  | 'commit-exists'
  | 'merge-commit-exists'
  | 'merge-in-progress'
  | 'commit-count'
  | 'head-message'
  | 'markers-committed'
>

type RemoteGoal = GoalOfKind<'up-to-date-with-remote' | 'pushed' | 'upstream-set' | 'clone-exists'>

type StashGoal = GoalOfKind<'stash-count' | 'stash-empty'>

type ConfigGoal = GoalOfKind<'config-set' | 'config-equals'>

function containsText(value: string | null, needle: string): boolean {
  return value !== null && value.toLowerCase().includes(needle.toLowerCase())
}

function coversPath(entries: readonly string[], path: string): boolean {
  const folder = path.endsWith('/') ? path : `${path}/`
  return entries.some((entry) => entry === path || entry.startsWith(folder))
}

function matchesCommit(commit: CommitSummary, check: GoalOfKind<'commit-exists'>): boolean {
  const { containing, modifies, onBranch, messageIncludes } = check
  if (containing && !containing.every((path) => commit.files.includes(path))) return false
  if (modifies && !modifies.every((path) => commit.modified.includes(path))) return false
  if (onBranch && !commit.branches.includes(onBranch)) return false
  if (messageIncludes && !containsText(commit.message, messageIncludes)) return false
  return true
}

function evaluateBranchGoal(check: BranchGoal, snapshot: RepoSnapshot): boolean {
  switch (check.kind) {
    case 'repo-initialized':
      return snapshot.repoLocation === 'project'
    case 'repo-above-project':
      return snapshot.repoLocation === 'above'
    case 'branch-exists':
      return snapshot.branches.includes(check.name)
    case 'branch-absent':
      return snapshot.isRepo && !snapshot.branches.includes(check.name)
    case 'on-branch':
      return snapshot.branch === check.name
  }
}

function inWorkdir(snapshot: RepoSnapshot, path: string): boolean {
  if (!path.includes('/') && !path.startsWith('.')) return snapshot.workdirFiles.includes(path)
  return snapshot.workdirPaths.some((entry) => entry === path || entry.startsWith(`${path}/`))
}

function evaluateWorkingTreeGoal(check: WorkingTreeGoal, snapshot: RepoSnapshot): boolean {
  switch (check.kind) {
    case 'no-conflict-markers':
      return snapshot.conflictMarkerFiles.length === 0
    case 'files-staged':
      return check.paths.every((path) => snapshot.staged.some((change) => change.path === path))
    case 'working-tree-clean':
      return (
        snapshot.isRepo &&
        snapshot.staged.length === 0 &&
        snapshot.unstaged.length === 0 &&
        snapshot.untracked.length === 0
      )
    case 'file-present':
      return inWorkdir(snapshot, check.path)
    case 'file-absent':
      return snapshot.isRepo && !inWorkdir(snapshot, check.path)
    case 'file-line-count':
      return (snapshot.lineCounts[check.path] ?? 0) >= check.atLeast
    case 'file-ignored':
      return coversPath(snapshot.ignored, check.path)
    case 'file-tracked':
      return snapshot.tracked.includes(check.path)
    case 'file-untracked':
      return snapshot.isRepo && !snapshot.tracked.includes(check.path)
  }
}

function evaluateHistoryGoal(check: HistoryGoal, snapshot: RepoSnapshot): boolean {
  switch (check.kind) {
    case 'commit-exists':
      return snapshot.commits.some((commit) =>
        matchesCommit(commit, check),
      )
    case 'merge-commit-exists':
      return snapshot.commits.some(
        (commit) =>
          commit.parents.length > 1 && (!check.onBranch || commit.branches.includes(check.onBranch)),
      )
    case 'merge-in-progress':
      return snapshot.mergeInProgress
    case 'commit-count':
      return snapshot.commits.length === check.count
    case 'head-message':
      return containsText(snapshot.headMessage, check.includes)
    case 'markers-committed':
      return snapshot.markersCommitted
  }
}

function evaluateRemoteGoal(check: RemoteGoal, snapshot: RepoSnapshot): boolean {
  switch (check.kind) {
    case 'up-to-date-with-remote': {
      const tracking = snapshot.tracking[check.branch]
      return tracking !== undefined && tracking.ahead === 0 && tracking.behind === 0
    }
    case 'pushed':
      return snapshot.tracking[check.branch]?.ahead === 0
    case 'upstream-set':
      return snapshot.upstreams[check.branch] !== undefined
    case 'clone-exists':
      return snapshot.clones.includes(check.path)
  }
}

function evaluateStashGoal(check: StashGoal, snapshot: RepoSnapshot): boolean {
  switch (check.kind) {
    case 'stash-count':
      return snapshot.stashes.length === check.count
    case 'stash-empty':
      return snapshot.isRepo && snapshot.stashes.length === 0
  }
}

function evaluateConfigGoal(check: ConfigGoal, snapshot: RepoSnapshot): boolean {
  const value = snapshot.config[check.key]
  switch (check.kind) {
    case 'config-set':
      return value !== undefined
    case 'config-equals':
      return value !== undefined && value.toLowerCase() === check.value.toLowerCase()
  }
}

function evaluateLeafGoal(check: LeafGoal, snapshot: RepoSnapshot): boolean {
  switch (check.kind) {
    case 'repo-initialized':
    case 'repo-above-project':
    case 'branch-exists':
    case 'branch-absent':
    case 'on-branch':
      return evaluateBranchGoal(check, snapshot)
    case 'no-conflict-markers':
    case 'files-staged':
    case 'working-tree-clean':
    case 'file-present':
    case 'file-absent':
    case 'file-line-count':
    case 'file-ignored':
    case 'file-tracked':
    case 'file-untracked':
      return evaluateWorkingTreeGoal(check, snapshot)
    case 'commit-exists':
    case 'merge-commit-exists':
    case 'merge-in-progress':
    case 'commit-count':
    case 'head-message':
    case 'markers-committed':
      return evaluateHistoryGoal(check, snapshot)
    case 'up-to-date-with-remote':
    case 'pushed':
    case 'upstream-set':
    case 'clone-exists':
      return evaluateRemoteGoal(check, snapshot)
    case 'stash-count':
    case 'stash-empty':
      return evaluateStashGoal(check, snapshot)
    case 'config-set':
    case 'config-equals':
      return evaluateConfigGoal(check, snapshot)
  }
}

export function evaluateGoal(check: GoalCheck, snapshot: RepoSnapshot): boolean {
  if (check.kind === 'all-of') return check.checks.every((nested) => evaluateGoal(nested, snapshot))
  if (check.kind === 'any-of') return check.checks.some((nested) => evaluateGoal(nested, snapshot))
  if (check.kind === 'not') return !evaluateGoal(check.check, snapshot)
  return evaluateLeafGoal(check, snapshot)
}
