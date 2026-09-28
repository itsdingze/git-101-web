import { describe, expect, it } from 'vitest'
import type { ConflictExerciseStep } from '@/types'
import { composeConflictedFile } from './conflictFileText'
import { checkResolution } from './resolutionCheck'

const STEP: ConflictExerciseStep = {
  type: 'conflict-exercise',
  id: 'resolve-conflict',
  prompt: 'Keep the incoming wording.',
  fileName: 'index.html',
  oursLabel: 'HEAD (main)',
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
  oursLabel: 'HEAD (main)',
  theirsLabel: 'feature-dark-mode',
  oursContent: '@import "components.css";',
  theirsContent: '@import "dark-theme.css";',
  acceptableResolutions: [
    '@import "components.css";\n@import "dark-theme.css";',
    '@import "dark-theme.css";\n@import "components.css";',
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

  it('rejects a clean file that kept the wrong side', () => {
    expect(checkResolution(STEP, RESOLVED.replace('Welcome to our amazing website!', 'Welcome back!'))).toBe(
      'wrong-content',
    )
  })

  it('rejects a clean file that deleted the surrounding lines', () => {
    expect(checkResolution(STEP, 'Welcome to our amazing website!')).toBe('wrong-content')
  })
})
