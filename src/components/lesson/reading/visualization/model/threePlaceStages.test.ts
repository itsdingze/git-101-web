import { describe, expect, it } from 'vitest'
import { commandsFor, stagesFor, zoneFiles } from './threePlaceStages'

const DATA = { files: ['index.html', 'style.css'], ignored: ['.env'], stageFirst: 'index.html', commitMessage: 'feat: first page' }

describe('threePlaceStages', () => {
  it('walks the files from untracked, through staged, to committed', () => {
    const stages = stagesFor(DATA)

    expect(stages.map((stage) => zoneFiles(stage, 'working').map((file) => file.state))).toEqual([
      ['new', 'new', 'ignored'],
      ['staged', 'new', 'ignored'],
      ['staged', 'staged', 'ignored'],
      ['committed', 'committed', 'ignored'],
    ])
    expect(stages.map((stage) => zoneFiles(stage, 'repo').map((file) => file.name))).toEqual([
      [],
      [],
      [],
      ['index.html', 'style.css'],
    ])
  })

  it('names the command that leads to each next stage', () => {
    expect(commandsFor(DATA)).toEqual(['git add index.html', 'git add .', 'git commit -m "feat: first page"'])
    expect(commandsFor(DATA)).toHaveLength(stagesFor(DATA).length - 1)
  })

  it('tones staged copies by the zone that holds them', () => {
    const [, firstStaged] = stagesFor(DATA)
    if (!firstStaged) throw new Error('missing stage')

    expect(zoneFiles(firstStaged, 'staging')).toEqual([{ name: 'index.html', tone: 'staging' }])
  })
})
