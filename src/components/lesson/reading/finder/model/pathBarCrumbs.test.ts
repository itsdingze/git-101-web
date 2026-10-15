import { describe, expect, it } from 'vitest'
import { pathBarCrumbs } from './pathBarCrumbs'

describe('pathBarCrumbs', () => {
  it('walks a location from the root disk down to its folder, each crumb leading to its own location', () => {
    expect(pathBarCrumbs(['home', 'user', 'projects'])).toEqual([
      { key: '/', kind: 'disk', name: 'root', location: [] },
      { key: '/home', kind: 'folder', name: 'home', location: ['home'] },
      { key: '/home/user', kind: 'folder', name: 'user', location: ['home', 'user'] },
      { key: '/home/user/projects', kind: 'folder', name: 'projects', location: ['home', 'user', 'projects'] },
    ])
  })

  it('shows only the disk at the root', () => {
    expect(pathBarCrumbs([]).map((crumb) => crumb.name)).toEqual(['root'])
  })
})
