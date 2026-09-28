import { describe, expect, it } from 'vitest'
import type { ConflictExerciseStep } from '@/types'
import { composeConflictedFile } from './conflictFileText'
import { checkResolution } from './resolutionCheck'

const STEP: ConflictExerciseStep = {
  type: 'conflict-exercise',
  id: 'resolve-conflict',
  prompt: 'Keep the incoming wording.',
  fileName: 'index.html',
  oursLabel: 'HEAD',
  theirsLabel: 'feature-banner',
  oursContent: 'Welcome back!',
  theirsContent: 'Welcome to our amazing website!',
  surroundingBefore: '<body>\n  <header>',
  surroundingAfter: '  </header>\n</body>',
  acceptableResolutions: ['Welcome to our amazing website!'],
}

const BOTH_SIDES: ConflictExerciseStep = {
  type: 'conflict-exercise',
  id: 'keep-both',
  prompt: 'Keep both imports.',
  fileName: 'styles.css',
  oursLabel: 'HEAD',
  theirsLabel: 'feature-dark-mode',
  oursContent: '@import "components.css";',
  theirsContent: '@import "dark-theme.css";',
  acceptableResolutions: [
    '@import "components.css";\n@import "dark-theme.css";',
    '@import "dark-theme.css";\n@import "components.css";',
  ],
}

const CREDITS: ConflictExerciseStep = {
  type: 'conflict-exercise',
  id: 'keep-both-credits',
  prompt: 'Keep both credit lines.',
  fileName: 'credits.txt',
  oursLabel: 'HEAD',
  theirsLabel: 'add-photo-credits',
  oursContent: 'Illustrations by Tom Blake',
  theirsContent: 'Photographs by Rosa Ibarra',
  surroundingBefore: 'With thanks to:',
  acceptableResolutions: [
    'Illustrations by Tom Blake\nPhotographs by Rosa Ibarra',
    'Photographs by Rosa Ibarra\nIllustrations by Tom Blake',
  ],
}

const RESOLVED = ['<body>', '  <header>', 'Welcome to our amazing website!', '  </header>', '</body>'].join('\n')

describe('checkResolution', () => {
  it('accepts the file once the markers are gone and the wanted line survives', () => {
    expect(checkResolution(STEP, RESOLVED)).toBe('solved')
  })

  it('accepts any of the listed resolutions', () => {
    expect(
      checkResolution(BOTH_SIDES, '@import "dark-theme.css";\n@import "components.css";'),
    ).toBe('solved')
  })

  it('ignores trailing whitespace and trailing blank lines', () => {
    expect(checkResolution(STEP, `${RESOLVED.replace('</body>', '</body>   ')}\n\n\n`)).toBe(
      'solved',
    )
  })

  it('reports the untouched conflicted file as a leftover marker', () => {
    expect(checkResolution(STEP, composeConflictedFile(STEP))).toBe('marker-left')
  })

  it('reports a forgotten closing marker even when the right line survives', () => {
    const almost = [
      '<body>',
      '  <header>',
      'Welcome to our amazing website!',
      '>>>>>>> feature-banner',
      '  </header>',
      '</body>',
    ].join('\n')

    expect(checkResolution(STEP, almost)).toBe('marker-left')
  })

  it('prefers the marker verdict over the content verdict', () => {
    const wrongAndMarked = ['<body>', '  <header>', '=======', '  </header>', '</body>'].join('\n')

    expect(checkResolution(STEP, wrongAndMarked)).toBe('marker-left')
  })

  it('names the side that was kept when the step wants the other one', () => {
    expect(checkResolution(STEP, RESOLVED.replace('Welcome to our amazing website!', 'Welcome back!'))).toBe(
      'kept-ours',
    )
  })

  it('names the incoming side when that is the one wrongly kept', () => {
    const wantsOurs: ConflictExerciseStep = { ...STEP, acceptableResolutions: ['Welcome back!'] }

    expect(checkResolution(wantsOurs, RESOLVED)).toBe('kept-theirs')
  })

  it('calls a one-word slip a near miss', () => {
    expect(checkResolution(STEP, RESOLVED.replace('amazing', 'amazng'))).toBe('near-miss')
    expect(checkResolution(STEP, RESOLVED.replace('Welcome to our', 'Welcome our'))).toBe('near-miss')
  })

  it('rejects a clean file that deleted the surrounding lines', () => {
    expect(checkResolution(STEP, 'Welcome to our amazing website!')).toBe('wrong-content')
  })

  it('says both versions were kept when the step wants only one', () => {
    const both = RESOLVED.replace('Welcome to our amazing website!', 'Welcome back!\nWelcome to our amazing website!')

    expect(checkResolution(STEP, both)).toBe('kept-both')
  })

  it('says a side is missing when the step wants both', () => {
    expect(checkResolution(BOTH_SIDES, '@import "components.css";')).toBe('missing-side')
    expect(checkResolution(BOTH_SIDES, '@import "dark-theme.css";')).toBe('missing-side')
  })

  it('calls a typo in one of the kept lines a near miss, not a missing line', () => {
    expect(checkResolution(BOTH_SIDES, '@import "components.css";\n@import "dark-theem.css";')).toBe('near-miss')
    expect(checkResolution(CREDITS, 'With thanks to:\nIllustrations by Tom Blake\nPhotographs by Rosa Ibara')).toBe(
      'near-miss',
    )
  })

  it('still reports a genuinely deleted line as missing', () => {
    expect(checkResolution(CREDITS, 'With thanks to:\nIllustrations by Tom Blake')).toBe('missing-side')
  })

  it('falls back to a neutral verdict when both sides are gone from a keep-both step', () => {
    expect(checkResolution(BOTH_SIDES, '@import "base.css";')).toBe('wrong-content')
  })
})
