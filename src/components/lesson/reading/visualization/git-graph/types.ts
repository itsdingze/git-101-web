import type { GraphBranch, GraphStage } from '@/types'

export type Branch = GraphBranch & {
  color: string
  labelColor: string
}

export type Stage = Omit<GraphStage, 'branches'> & {
  branches: Branch[]
}

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
