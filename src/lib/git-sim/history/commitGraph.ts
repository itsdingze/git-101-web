type GraphCommit = {
  oid: string
  parents: readonly string[]
}

export function topoOrderCommits<T extends GraphCommit>(commits: readonly T[]): T[] {
  const byOid = new Map(commits.map((commit) => [commit.oid, commit]))
  const childCount = new Map<string, number>(commits.map((commit) => [commit.oid, 0]))

  for (const commit of commits) {
    for (const parent of commit.parents) {
      if (childCount.has(parent)) childCount.set(parent, (childCount.get(parent) ?? 0) + 1)
    }
  }

  const stack = commits.filter((commit) => (childCount.get(commit.oid) ?? 0) === 0).reverse()
  const ordered: T[] = []
  const seen = new Set<string>()

  for (let commit = stack.pop(); commit; commit = stack.pop()) {
    if (seen.has(commit.oid)) continue
    seen.add(commit.oid)
    ordered.push(commit)

    for (const oid of commit.parents) {
      const parent = byOid.get(oid)
      if (!parent) continue
      const remaining = (childCount.get(oid) ?? 0) - 1
      childCount.set(oid, remaining)
      if (remaining === 0) stack.push(parent)
    }
  }

  return ordered
}

type GraphState = 'padding' | 'commit' | 'post-merge' | 'collapsing'

type GraphWalk = {
  known: ReadonlySet<string>
  commit: string
  parents: string[]
  columns: string[]
  newColumns: string[]
  mapping: number[]
  oldMapping: number[]
  mappingSize: number
  width: number
  commitIndex: number
  prevCommitIndex: number
  mergeLayout: number
  edgesAdded: number
  prevEdgesAdded: number
  state: GraphState
  prevState: GraphState
}

type CommitGraph = {
  draw: (commit: GraphCommit, messageLines: readonly string[], separated: boolean) => string[]
}

const MERGE_CHARS = ['/', '|', '\\'] as const
const MAX_REMAINDER_LINES = 64

function setState(walk: GraphWalk, state: GraphState): void {
  walk.prevState = walk.state
  walk.state = state
}

function padded(walk: GraphWalk, line: string): string {
  return line.padEnd(walk.width, ' ')
}

function isMappingCorrect(walk: GraphWalk): boolean {
  for (let i = 0; i < walk.mappingSize; i += 1) {
    const target = walk.mapping[i] ?? -1
    if (target >= 0 && target !== Math.floor(i / 2)) return false
  }
  return true
}

function insertIntoNewColumns(walk: GraphWalk, oid: string, commitColumn: number): void {
  let column = walk.newColumns.indexOf(oid)
  if (column < 0) {
    column = walk.newColumns.length
    walk.newColumns.push(oid)
  }

  let mappingIndex: number
  if (walk.parents.length > 1 && commitColumn > -1 && walk.mergeLayout === -1) {
    const distance = commitColumn - column
    const shift = distance > 1 ? 2 * distance - 3 : 1
    walk.mergeLayout = distance > 0 ? 0 : 1
    walk.edgesAdded = walk.parents.length + walk.mergeLayout - 2
    mappingIndex = walk.width + (walk.mergeLayout - 1) * shift
    walk.width += 2 * walk.mergeLayout
  } else if (walk.edgesAdded > 0 && column === walk.mapping[walk.width - 2]) {
    mappingIndex = walk.width - 2
    walk.edgesAdded = -1
  } else {
    mappingIndex = walk.width
    walk.width += 2
  }

  walk.mapping[mappingIndex] = column
}

function updateColumns(walk: GraphWalk): void {
  walk.columns = walk.newColumns
  walk.newColumns = []
  walk.mappingSize = 2 * (walk.columns.length + walk.parents.length)
  walk.mapping = Array<number>(walk.mappingSize).fill(-1)
  walk.width = 0
  walk.prevEdgesAdded = walk.edgesAdded
  walk.edgesAdded = 0

  let seenThis = false
  for (let i = 0; i <= walk.columns.length; i += 1) {
    if (i === walk.columns.length && seenThis) break
    const columnCommit = i === walk.columns.length ? walk.commit : walk.columns[i]

    if (columnCommit === walk.commit) {
      seenThis = true
      walk.commitIndex = i
      walk.mergeLayout = -1
      for (const parent of walk.parents) insertIntoNewColumns(walk, parent, i)
      if (walk.parents.length === 0) walk.width += 2
    } else if (columnCommit !== undefined) {
      insertIntoNewColumns(walk, columnCommit, -1)
    }
  }

  while (walk.mappingSize > 1 && (walk.mapping[walk.mappingSize - 1] ?? -1) < 0) walk.mappingSize -= 1
}

function update(walk: GraphWalk, commit: GraphCommit): void {
  walk.commit = commit.oid
  walk.parents = [...new Set(commit.parents.filter((parent) => walk.known.has(parent)))]
  walk.prevCommitIndex = walk.commitIndex
  updateColumns(walk)
  walk.state = 'commit'
}

function eachColumnWithCommit(walk: GraphWalk, visit: (column: string, index: number, isCommit: boolean) => void): void {
  let seenThis = false
  for (let i = 0; i <= walk.columns.length; i += 1) {
    if (i === walk.columns.length && seenThis) break
    const columnCommit = i === walk.columns.length ? walk.commit : (walk.columns[i] ?? '')
    const isCommit = columnCommit === walk.commit
    if (isCommit) seenThis = true
    visit(columnCommit, i, isCommit)
  }
}

function octopusDashes(walk: GraphWalk): string {
  const dashed = walk.parents.length + walk.mergeLayout - 3
  let dashes = ''
  for (let i = 0; i < dashed; i += 1) dashes += i === dashed - 1 ? '-.' : '--'
  return dashes
}

function commitLine(walk: GraphWalk): string {
  let line = ''
  let seenThis = false

  eachColumnWithCommit(walk, (_column, i, isCommit) => {
    if (isCommit) {
      seenThis = true
      line += '*'
      if (walk.parents.length > 2) line += octopusDashes(walk)
    } else if (seenThis && walk.edgesAdded > 1) {
      line += '\\'
    } else if (seenThis && walk.edgesAdded === 1) {
      const leansIn = walk.prevState === 'post-merge' && walk.prevEdgesAdded > 0 && walk.prevCommitIndex < i
      line += leansIn ? '\\' : '|'
    } else if (
      walk.prevState === 'collapsing' &&
      walk.oldMapping[2 * i + 1] === i &&
      (walk.mapping[2 * i] ?? -1) < i
    ) {
      line += '/'
    } else {
      line += '|'
    }
    line += ' '
  })

  if (walk.parents.length > 1) setState(walk, 'post-merge')
  else if (isMappingCorrect(walk)) setState(walk, 'padding')
  else setState(walk, 'collapsing')

  return padded(walk, line)
}

function postMergeLine(walk: GraphWalk): string {
  const firstParent = walk.parents[0]
  let line = ''
  let seenThis = false
  let firstParentColumnSeen = false

  eachColumnWithCommit(walk, (column, i, isCommit) => {
    if (isCommit) {
      seenThis = true
      let layout = walk.mergeLayout
      walk.parents.forEach((_parent, j) => {
        line += MERGE_CHARS[layout] ?? '|'
        if (layout === 2) {
          if (walk.edgesAdded > 0 || j < walk.parents.length - 1) line += ' '
        } else {
          layout += 1
        }
      })
      if (walk.edgesAdded === 0) line += ' '
    } else if (seenThis) {
      line += walk.edgesAdded > 0 ? '\\ ' : '| '
    } else {
      line += '|'
      if (walk.mergeLayout !== 0 || i !== walk.commitIndex - 1) line += firstParentColumnSeen ? '_' : ' '
    }
    if (column === firstParent) firstParentColumnSeen = true
  })

  setState(walk, isMappingCorrect(walk) ? 'padding' : 'collapsing')
  return padded(walk, line)
}

function collapseMapping(walk: GraphWalk): { edge: number; edgeTarget: number } {
  walk.oldMapping = walk.mapping
  walk.mapping = Array<number>(walk.mappingSize).fill(-1)
  let edge = -1
  let edgeTarget = -1

  const markHorizontal = (target: number, i: number): void => {
    for (let j = target * 2 + 3; j < i - 2; j += 2) walk.mapping[j] = target
  }

  for (let i = 0; i < walk.mappingSize; i += 1) {
    const target = walk.oldMapping[i] ?? -1
    if (target < 0) continue

    if (target * 2 === i) {
      walk.mapping[i] = target
    } else if ((walk.mapping[i - 1] ?? -1) < 0) {
      walk.mapping[i - 1] = target
      if (edge === -1) {
        edge = i
        edgeTarget = target
        markHorizontal(target, i)
      }
    } else if (walk.mapping[i - 1] !== target) {
      walk.mapping[i - 2] = target
      if (edge === -1) {
        edgeTarget = target
        edge = i - 1
        markHorizontal(target, i)
      }
    }
  }

  return { edge, edgeTarget }
}

function collapsingLine(walk: GraphWalk): string {
  const { edge, edgeTarget } = collapseMapping(walk)
  walk.oldMapping = [...walk.mapping]
  if ((walk.mapping[walk.mappingSize - 1] ?? -1) < 0) walk.mappingSize -= 1

  let line = ''
  let usedHorizontal = false
  for (let i = 0; i < walk.mappingSize; i += 1) {
    const target = walk.mapping[i] ?? -1
    if (target < 0) {
      line += ' '
    } else if (target * 2 === i) {
      line += '|'
    } else if (target === edgeTarget && i !== edge - 1) {
      if (i !== target * 2 + 3) walk.mapping[i] = -1
      usedHorizontal = true
      line += '_'
    } else {
      if (usedHorizontal && i < edge) walk.mapping[i] = -1
      line += '/'
    }
  }

  if (isMappingCorrect(walk)) setState(walk, 'padding')
  return padded(walk, line)
}

function paddingLine(walk: GraphWalk): string {
  return padded(walk, walk.newColumns.map(() => '| ').join(''))
}

function separatorLine(walk: GraphWalk): string {
  walk.prevState = 'padding'
  return padded(walk, walk.columns.map(() => '| ').join(''))
}

function nextLine(walk: GraphWalk): string {
  switch (walk.state) {
    case 'commit':
      return commitLine(walk)
    case 'post-merge':
      return postMergeLine(walk)
    case 'collapsing':
      return collapsingLine(walk)
    case 'padding':
      return paddingLine(walk)
  }
}

export function createCommitGraph(commits: readonly GraphCommit[]): CommitGraph {
  const walk: GraphWalk = {
    known: new Set(commits.map((commit) => commit.oid)),
    commit: '',
    parents: [],
    columns: [],
    newColumns: [],
    mapping: [],
    oldMapping: [],
    mappingSize: 0,
    width: 0,
    commitIndex: 0,
    prevCommitIndex: 0,
    mergeLayout: -1,
    edgesAdded: 0,
    prevEdgesAdded: 0,
    state: 'padding',
    prevState: 'padding',
  }

  return {
    draw: (commit, messageLines, separated) => {
      update(walk, commit)
      const lines = separated ? [separatorLine(walk)] : []
      for (const message of messageLines) lines.push(nextLine(walk) + message)
      for (let count = 0; walk.state !== 'padding' && count < MAX_REMAINDER_LINES; count += 1) {
        lines.push(nextLine(walk))
      }
      return lines
    },
  }
}
