import { describe, expect, it } from 'vitest'
import { capturesIdentity, identityToSave, seedWithIdentity } from './learnerIdentity'

describe('capturesIdentity', () => {
  it('is true only for a seed that starts with a blank identity', () => {
    expect(capturesIdentity({ dir: 'cookbook', identity: { name: '', email: '' } })).toBe(true)
    expect(capturesIdentity({ dir: 'cookbook', identity: { name: 'Ada', email: 'ada@example.com' } })).toBe(false)
    expect(capturesIdentity({ dir: 'cookbook' })).toBe(false)
  })
})

describe('identityToSave', () => {
  it('returns the name and email once both are set', () => {
    expect(identityToSave({ 'user.name': 'Ada Lovelace', 'user.email': 'ada@example.com' })).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
  })

  it('waits until both values exist', () => {
    expect(identityToSave({ 'user.name': 'Ada Lovelace' })).toBeNull()
    expect(identityToSave({ 'user.email': 'ada@example.com' })).toBeNull()
    expect(identityToSave({})).toBeNull()
  })

  it('ignores the placeholder name, whatever its case', () => {
    expect(identityToSave({ 'user.name': 'your name', 'user.email': 'ada@example.com' })).toBeNull()
    expect(identityToSave({ 'user.name': 'Your Name', 'user.email': 'ada@example.com' })).toBeNull()
  })
})

describe('seedWithIdentity', () => {
  const seed = { dir: 'my-story' }

  it('adds a stored identity to a seed that has none', () => {
    expect(seedWithIdentity(seed, { name: 'Ada', email: 'ada@example.com' })).toEqual({
      dir: 'my-story',
      identity: { name: 'Ada', email: 'ada@example.com' },
    })
  })

  it('leaves the seed alone without a stored identity or when it sets its own', () => {
    expect(seedWithIdentity(seed, null)).toBe(seed)
    const own = { dir: 'cookbook', identity: { name: '', email: '' } }
    expect(seedWithIdentity(own, { name: 'Ada', email: 'ada@example.com' })).toBe(own)
  })
})
