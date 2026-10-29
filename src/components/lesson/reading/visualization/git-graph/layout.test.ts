import { describe, expect, it } from 'vitest'
import { branchHeads, phantomCommits } from './layout'
import type { Branch, Stage } from './types'

function branch(name: string, lane: number, startsAt?: string): Branch {
  return { name, lane, startsAt, color: `color-${name}`, labelColor: `label-${name}` }
}

function commit(id: string, branchName: string, parents: string[] = []) {
  return { id, message: id, branch: branchName, parents }
}

describe('branchHeads', () => {
  it('points each branch at its newest commit', () => {
    const stage: Stage = {
      commits: [commit('a', 'main'), commit('b', 'main', ['a']), commit('c', 'feature', ['b'])],
      branches: [branch('main', 0), branch('feature', 1, 'b')],
      head: 'feature',
    }

    expect(branchHeads(stage)).toEqual({ main: 'b', feature: 'c' })
  })

  it('points a branch without commits at the commit it starts from', () => {
    const stage: Stage = {
      commits: [commit('a', 'main')],
      branches: [branch('main', 0), branch('feature', 1, 'a')],
      head: 'main',
    }

    expect(branchHeads(stage)).toEqual({ main: 'a', feature: 'a' })
  })

  it('leaves out a branch with neither commits nor a starting point', () => {
    const stage: Stage = {
      commits: [commit('a', 'main')],
      branches: [branch('main', 0), branch('orphan', 1)],
      head: 'main',
    }

    expect(branchHeads(stage)).toEqual({ main: 'a' })
  })
})

describe('phantomCommits', () => {
  it('places an empty branch one row above its starting commit, in its own lane', () => {
    const feature = branch('feature', 1, 'a')
    const stage: Stage = {
      commits: [commit('a', 'main')],
      branches: [branch('main', 0), feature],
      head: 'feature',
    }

    expect(phantomCommits(stage, { a: { x: 20, y: 200 } })).toEqual([
      { branch: feature, x: 66, y: 148, pathD: 'M 20 200 C 20 174, 66 174, 66 148' },
    ])
  })

  it('draws no phantom for a branch that already has commits', () => {
    const stage: Stage = {
      commits: [commit('a', 'main'), commit('b', 'feature', ['a'])],
      branches: [branch('main', 0), branch('feature', 1, 'a')],
      head: 'feature',
    }

    expect(phantomCommits(stage, { a: { x: 20, y: 200 }, b: { x: 66, y: 148 } })).toEqual([])
  })

  it('draws no phantom when the starting commit has no position', () => {
    const stage: Stage = {
      commits: [commit('a', 'main')],
      branches: [branch('main', 0), branch('feature', 1, 'missing')],
      head: 'main',
    }

    expect(phantomCommits(stage, { a: { x: 20, y: 200 } })).toEqual([])
  })
})
