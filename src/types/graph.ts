export type Commit = {
  id: string
  message: string
  branch: string
  parents: string[]
}

export type GraphBranch = {
  name: string
  lane: number
  startsAt?: string
}

export type GraphStage = {
  commits: Commit[]
  branches: GraphBranch[]
  head: string
}

export type GitScenario = {
  commands: string[]
  stages: GraphStage[]
}
