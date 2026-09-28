import { describe, expect, it } from 'vitest'
import { combinedDiffLines } from './combinedDiff'

describe('combinedDiffLines, matched to git 2.51 diff --cc', () => {
  it('shows a conflict with both sides and the markers', () => {
    const ours = 'one\nmain\nthree\n'
    const theirs = 'one\nfeat\nthree\n'
    const result = 'one\n<<<<<<< HEAD\nmain\n=======\nfeat\n>>>>>>> feature\nthree\n'

    expect(combinedDiffLines(ours, theirs, result)).toEqual([
      '@@@ -1,3 -1,3 +1,7 @@@',
      '  one',
      '++<<<<<<< HEAD',
      ' +main',
      '++=======',
      '+ feat',
      '++>>>>>>> feature',
      '  three',
    ])
  })

  it('leaves out a change that simply takes one side, like the dense --cc view', () => {
    expect(combinedDiffLines('one\nmain\nthree\n', 'one\nfeat\nthree\n', 'one\nfeat\nthree\n')).toEqual([])
  })

  it('marks a line dropped from both sides with a minus in each column', () => {
    const ours = 'one\nmain\nthree\n'
    const theirs = 'one\nfeat\nthree\n'
    const result = 'one\nboth\nthree\n'

    expect(combinedDiffLines(ours, theirs, result)).toEqual([
      '@@@ -1,3 -1,3 +1,3 @@@',
      '  one',
      '- main',
      ' -feat',
      '++both',
      '  three',
    ])
  })

  it('shows nothing when the result equals both sides', () => {
    expect(combinedDiffLines('same\n', 'same\n', 'same\n')).toEqual([])
  })
})
