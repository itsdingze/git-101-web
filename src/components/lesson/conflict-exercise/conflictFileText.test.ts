import { describe, expect, it } from 'vitest'
import type { ConflictExerciseStep } from '@/types'
import { composeConflictedFile, composeResolvedFile } from './conflictFileText'

const SURROUNDED: ConflictExerciseStep = {
  type: 'conflict-exercise',
  id: 'surrounded',
  prompt: 'Resolve it.',
  fileName: 'index.html',
  oursLabel: 'HEAD',
  theirsLabel: 'feature-banner',
  oursContent: 'Welcome back!',
  theirsContent: 'Welcome to our amazing website!',
  surroundingBefore: '<body>\n  <header>',
  surroundingAfter: '  </header>\n</body>',
  acceptableResolutions: ['Welcome to our amazing website!'],
}

const BARE: ConflictExerciseStep = {
  type: 'conflict-exercise',
  id: 'bare',
  prompt: 'Keep both.',
  fileName: 'styles.css',
  oursLabel: 'HEAD',
  theirsLabel: 'feature-dark-mode',
  oursContent: '@import "components.css";',
  theirsContent: '@import "dark-theme.css";',
  acceptableResolutions: ['@import "components.css";\n@import "dark-theme.css";'],
}

describe('composeConflictedFile', () => {
  it('wraps the conflict block in the surrounding lines', () => {
    expect(composeConflictedFile(SURROUNDED)).toBe(
      [
        '<body>',
        '  <header>',
        '<<<<<<< HEAD',
        'Welcome back!',
        '=======',
        'Welcome to our amazing website!',
        '>>>>>>> feature-banner',
        '  </header>',
        '</body>',
      ].join('\n'),
    )
  })

  it('emits only the conflict block when the step has no surroundings', () => {
    expect(composeConflictedFile(BARE)).toBe(
      [
        '<<<<<<< HEAD',
        '@import "components.css";',
        '=======',
        '@import "dark-theme.css";',
        '>>>>>>> feature-dark-mode',
      ].join('\n'),
    )
  })
})

describe('composeResolvedFile', () => {
  it('drops the markers and keeps the surrounding lines', () => {
    expect(composeResolvedFile(SURROUNDED, 'Welcome to our amazing website!')).toBe(
      ['<body>', '  <header>', 'Welcome to our amazing website!', '  </header>', '</body>'].join(
        '\n',
      ),
    )
  })

  it('returns the resolution alone when the step has no surroundings', () => {
    expect(composeResolvedFile(BARE, '@import "dark-theme.css";')).toBe('@import "dark-theme.css";')
  })
})
