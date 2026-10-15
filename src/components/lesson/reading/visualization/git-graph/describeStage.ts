import type { Stage } from './types'
import { messages } from '@/messages/en'

export function describeStage(stage: Stage): string {
  const branches = stage.branches.map((b) => b.name).join(messages.reading.graph.branchJoiner)
  return messages.reading.graph.describe(stage.commits.length, branches, stage.head)
}
