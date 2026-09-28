import type { SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { LearnerIdentity } from '@/types'

const PLACEHOLDER_NAME = 'your name'

export function capturesIdentity(seed: SandboxSeed): boolean {
  return seed.identity !== undefined && seed.identity.name === '' && seed.identity.email === ''
}

export function identityToSave(config: Readonly<Record<string, string>>): LearnerIdentity | null {
  const name = config['user.name']
  const email = config['user.email']
  if (!name || !email) return null
  if (name.trim().toLowerCase() === PLACEHOLDER_NAME) return null
  return { name, email }
}

export function seedWithIdentity(seed: SandboxSeed, identity: LearnerIdentity | null): SandboxSeed {
  if (seed.identity !== undefined || identity === null) return seed
  return { ...seed, identity }
}
