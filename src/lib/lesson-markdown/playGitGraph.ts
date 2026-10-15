import type { Commit, GitScenario, GraphBranch, GraphStage } from '@/types'

type GraphScript = {
  setup: readonly string[]
  commands: readonly string[]
}

type Graph = {
  commits: Commit[]
  branches: GraphBranch[]
  head: string
}

const MAIN = 'main'
const COMMIT = /^git commit -m "([^"]+)"$/
const CREATE_BRANCH = /^git switch -c (\S+)$/
const SWITCH = /^git switch (\S+)$/
const MERGE = /^git merge (\S+)$/

export function playGitGraph({ setup, commands }: GraphScript): GitScenario {
  const graph: Graph = { commits: [], branches: [{ name: MAIN, lane: 0 }], head: MAIN }
  setup.forEach((command) => play(graph, command))

  const stages = [snapshot(graph)]
  for (const command of commands) {
    play(graph, command)
    stages.push(snapshot(graph))
  }
  return { commands: [...commands], stages }
}

function play(graph: Graph, command: string): void {
  const [, message] = COMMIT.exec(command) ?? []
  if (message) return addCommit(graph, message, tipParents(graph, graph.head))

  const [, created] = CREATE_BRANCH.exec(command) ?? []
  if (created) return createBranch(graph, created, command)

  const [, target] = SWITCH.exec(command) ?? []
  if (target) return switchTo(graph, target)

  const [, merged] = MERGE.exec(command) ?? []
  if (merged) return merge(graph, merged, command)

  throw new Error(
    `the diagram can only play git commit -m "...", git switch, git switch -c and git merge, not "${command}"`,
  )
}

function addCommit(graph: Graph, message: string, parents: string[]): void {
  graph.commits.push({ id: `c${graph.commits.length + 1}`, message, branch: graph.head, parents })
}

function createBranch(graph: Graph, name: string, command: string): void {
  if (findBranch(graph, name)) throw new Error(`a branch "${name}" already exists`)
  const startsAt = tipOf(graph, graph.head)
  if (!startsAt) throw new Error(`commit before "${command}", since a branch starts from a commit`)
  graph.branches.push({ name, lane: graph.branches.length, startsAt })
  graph.head = name
}

function switchTo(graph: Graph, name: string): void {
  if (!findBranch(graph, name)) throw new Error(`no branch "${name}" to switch to`)
  graph.head = name
}

function merge(graph: Graph, name: string, command: string): void {
  const theirs = findBranch(graph, name) && tipOf(graph, name)
  if (!theirs) throw new Error(`no branch "${name}" to merge`)
  const ours = tipOf(graph, graph.head)
  if (!ours || isAncestor(graph, ours, theirs)) {
    throw new Error(`"${command}" would fast-forward, which the diagram can't draw`)
  }
  const into = graph.head === MAIN ? '' : ` into ${graph.head}`
  addCommit(graph, `Merge branch '${name}'${into}`, [ours, theirs])
}

function findBranch(graph: Graph, name: string): GraphBranch | undefined {
  return graph.branches.find((branch) => branch.name === name)
}

function tipOf(graph: Graph, name: string): string | undefined {
  return graph.commits.filter((commit) => commit.branch === name).pop()?.id ?? findBranch(graph, name)?.startsAt
}

function tipParents(graph: Graph, name: string): string[] {
  const tip = tipOf(graph, name)
  return tip ? [tip] : []
}

function isAncestor(graph: Graph, ancestor: string, descendant: string): boolean {
  if (ancestor === descendant) return true
  const parents = graph.commits.find((commit) => commit.id === descendant)?.parents ?? []
  return parents.some((parent) => isAncestor(graph, ancestor, parent))
}

function snapshot(graph: Graph): GraphStage {
  return {
    commits: graph.commits.map((commit) => ({ ...commit, parents: [...commit.parents] })),
    branches: graph.branches.map((branch) => withoutStartOnceCommitted(graph, branch)),
    head: graph.head,
  }
}

function withoutStartOnceCommitted(graph: Graph, branch: GraphBranch): GraphBranch {
  const committed = graph.commits.some((commit) => commit.branch === branch.name)
  return committed ? { name: branch.name, lane: branch.lane } : { ...branch }
}
