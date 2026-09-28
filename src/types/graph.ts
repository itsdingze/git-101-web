export type Commit = {
  id: string
  message: string
  branch: string
  parents: string[]
}

export type Branch = {
  name: string
  color: string
  lane: number
  /** Commit this branch points at while it has no commits of its own. */
  startsAt?: string
}

export type Stage = {
  commits: Commit[]
  branches: Branch[]
  /** Name of the checked-out branch. */
  head: string
}

export type GitScenario = {
  commands: string[]
  stages: Stage[]
}

export type ScenarioKey = 'branching' | 'merging'

export type Position = {
  x: number
  y: number
}

export type Connection = {
  id: string
  pathD: string
  color: string
}

export type PhantomCommit = {
  branch: Branch
  x: number
  y: number
  pathD: string
}
