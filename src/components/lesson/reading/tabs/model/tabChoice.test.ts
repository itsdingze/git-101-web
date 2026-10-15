import { describe, expect, it } from 'vitest'
import { initialTabIndex, platformHint } from './tabChoice'

const OS_TABS = ['Windows', 'Mac']

describe('platformHint', () => {
  it('recognises a Mac from its user agent', () => {
    expect(platformHint('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)')).toBe('mac')
  })

  it('recognises Windows', () => {
    expect(platformHint('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows')
  })

  it('makes no guess for anything else', () => {
    expect(platformHint('Mozilla/5.0 (X11; Linux x86_64)')).toBeNull()
    expect(platformHint('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBeNull()
  })
})

describe('initialTabIndex', () => {
  it('prefers the tab the learner chose before', () => {
    expect(initialTabIndex(OS_TABS, 'Mac', 'windows')).toBe(1)
  })

  it('falls back to the platform guess when nothing matches the stored choice', () => {
    expect(initialTabIndex(OS_TABS, null, 'mac')).toBe(1)
    expect(initialTabIndex(OS_TABS, 'Linux', 'windows')).toBe(0)
  })

  it('matches a platform inside a longer label', () => {
    expect(initialTabIndex(['On Windows', 'On a Mac'], null, 'mac')).toBe(1)
  })

  it('opens the first tab when there is no choice and no guess', () => {
    expect(initialTabIndex(OS_TABS, null, null)).toBe(0)
    expect(initialTabIndex(['Linux', 'Other'], null, 'mac')).toBe(0)
  })
})
