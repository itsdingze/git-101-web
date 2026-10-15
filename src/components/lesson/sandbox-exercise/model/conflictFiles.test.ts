import { describe, expect, it } from 'vitest'
import { conflictFiles } from './conflictFiles'

describe('conflictFiles', () => {
  it('is empty before any snapshot', () => {
    expect(conflictFiles(null)).toEqual([])
  })

  it('keeps a merge conflict file open to edit after its markers are gone', () => {
    expect(conflictFiles({ conflictMarkerFiles: [], mergeConflictFiles: ['app.py'] })).toEqual(['app.py'])
  })

  it('offers a file with markers outside a merge, such as after a stash pop', () => {
    expect(conflictFiles({ conflictMarkerFiles: ['notes.txt'], mergeConflictFiles: [] })).toEqual(['notes.txt'])
  })

  it('lists a file once when it is both conflicted and marked', () => {
    expect(conflictFiles({ conflictMarkerFiles: ['app.py'], mergeConflictFiles: ['app.py', 'README.md'] })).toEqual([
      'app.py',
      'README.md',
    ])
  })
})
