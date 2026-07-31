export type GraphCommit = {
  oid: string
  parents: readonly string[]
}

export type GraphRow = {
  prefix: string
  oid: string | null
}

/**
 * `git log --graph` implies `--topo-order`: a merge's side lineage is drawn to
 * completion before the line it rejoins, rather than interleaving by date.
 */
export function topoOrderCommits<T extends GraphCommit>(commits: readonly T[]): T[] {
  const byOid = new Map(commits.map((commit) => [commit.oid, commit]))
  const childCount = new Map<string, number>(commits.map((commit) => [commit.oid, 0]))

  for (const commit of commits) {
    for (const parent of commit.parents) {
      if (childCount.has(parent)) childCount.set(parent, (childCount.get(parent) ?? 0) + 1)
    }
  }

  const ready = commits.filter((commit) => (childCount.get(commit.oid) ?? 0) === 0)
  const ordered: T[] = []
  const seen = new Set<string>()

  while (ready.length > 0) {
    const commit = ready.shift()
    if (!commit || seen.has(commit.oid)) continue
    seen.add(commit.oid)
    ordered.push(commit)

    commit.parents.forEach((oid, position) => {
      const parent = byOid.get(oid)
      if (!parent) return
      const remaining = (childCount.get(oid) ?? 0) - 1
      childCount.set(oid, remaining)
      if (remaining > 0) return
      if (position === 0) ready.push(parent)
      else ready.unshift(parent)
    })
  }

  return ordered
}

function laneWidth(laneCount: number): number {
  return Math.max(1, laneCount * 2 - 1)
}

function padRow(marks: string, laneCount: number): string {
  return marks.padEnd(laneWidth(laneCount), ' ')
}

function placeCommit(lanes: (string | null)[], oid: string): number {
  const existing = lanes.indexOf(oid)
  if (existing !== -1) return existing

  const free = lanes.indexOf(null)
  if (free !== -1) {
    lanes[free] = oid
    return free
  }

  lanes.push(oid)
  return lanes.length - 1
}

function collapseRows(lanes: (string | null)[]): string[] {
  const rows: string[] = []

  for (let right = lanes.length - 1; right > 0; right -= 1) {
    const target = lanes[right]
    if (!target) continue
    const left = lanes.indexOf(target)
    if (left === -1 || left >= right) continue

    rows.push(padRow(`${' '.repeat(left * 2)}|${'/'.padStart((right - left) * 2 - 1, ' ')}`, lanes.length))
    lanes.splice(right, 1)
  }

  return rows
}

function trimTrailingLanes(lanes: (string | null)[]): void {
  while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop()
}

/** Handles linear history and two-parent merges, the shapes this course teaches. */
export function renderCommitGraph(commits: readonly GraphCommit[]): GraphRow[] {
  const lanes: (string | null)[] = []
  const rows: GraphRow[] = []

  for (const commit of commits) {
    const index = placeCommit(lanes, commit.oid)
    const extraParents = Math.max(0, commit.parents.length - 1)
    if (extraParents > 0) lanes.splice(index + 1, 0, ...Array<null>(extraParents).fill(null))

    const marks = lanes.map((lane, position) => {
      if (position === index) return '*'
      return lane ? '|' : ' '
    })
    rows.push({ prefix: padRow(marks.join(' '), lanes.length), oid: commit.oid })

    if (extraParents > 0) {
      rows.push({
        prefix: padRow(`${' '.repeat(index * 2)}|${'\\'.repeat(extraParents)}`, lanes.length),
        oid: null,
      })
    }

    commit.parents.forEach((parent, offset) => {
      lanes[index + offset] = parent
    })
    if (commit.parents.length === 0) lanes[index] = null

    trimTrailingLanes(lanes)
    for (const prefix of collapseRows(lanes)) rows.push({ prefix, oid: null })
    trimTrailingLanes(lanes)
  }

  return rows
}
