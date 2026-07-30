import type { Stage } from '@/types'

export default function describeStage(stage: Stage): string {
  const branches = stage.branches.map((b) => b.name).join(' and ')
  const commits = stage.commits.length === 1 ? '1 commit' : `${stage.commits.length} commits`

  return `Commit graph: ${commits} on ${branches}. HEAD is on ${stage.head}.`
}
