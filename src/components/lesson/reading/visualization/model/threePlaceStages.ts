import type { ThreePlaceModelData } from '@/types'

export type ZoneId = 'working' | 'staging' | 'repo'

export type FileState = 'new' | 'staged' | 'committed' | 'ignored'

export type FileTone = Exclude<ZoneId, 'working'> | FileState

type Stage = {
  working: { name: string; state: FileState }[]
  staging: readonly string[]
  repo: readonly string[]
}

type ZoneFile = {
  name: string
  tone: FileTone
  state?: FileState
}

export function stagesFor({ files, ignored, stageFirst }: ThreePlaceModelData): Stage[] {
  function everyFile(stateOf: (name: string) => FileState): Stage['working'] {
    return [
      ...files.map((name) => ({ name, state: stateOf(name) })),
      ...ignored.map((name) => ({ name, state: 'ignored' as const })),
    ]
  }

  return [
    { working: everyFile(() => 'new'), staging: [], repo: [] },
    { working: everyFile((name) => (name === stageFirst ? 'staged' : 'new')), staging: [stageFirst], repo: [] },
    { working: everyFile(() => 'staged'), staging: files, repo: [] },
    { working: everyFile(() => 'committed'), staging: [], repo: files },
  ]
}

export function commandsFor({ stageFirst, commitMessage }: ThreePlaceModelData): string[] {
  return [`git add ${stageFirst}`, 'git add .', `git commit -m "${commitMessage}"`]
}

export function zoneFiles(stage: Stage, zone: ZoneId): ZoneFile[] {
  if (zone === 'working') {
    return stage.working.map((file) => ({ name: file.name, tone: file.state, state: file.state }))
  }
  return stage[zone].map((name) => ({ name, tone: zone }))
}
