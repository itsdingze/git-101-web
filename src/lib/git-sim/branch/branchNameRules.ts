import { SandboxError } from '@/lib/git-sim/errors'

const FORBIDDEN_CHARACTERS = new Set([...' ~^:?*[\\'])

function hasForbiddenCharacter(name: string): boolean {
  return [...name].some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 || FORBIDDEN_CHARACTERS.has(character)
  })
}

function isValidComponent(component: string): boolean {
  return component !== '' && !component.startsWith('.') && !component.endsWith('.lock')
}

export function isValidBranchName(name: string): boolean {
  return (
    name !== 'HEAD' &&
    name !== '@' &&
    !name.startsWith('-') &&
    !name.includes('..') &&
    !name.includes('@{') &&
    !name.endsWith('.') &&
    !hasForbiddenCharacter(name) &&
    name.split('/').every(isValidComponent)
  )
}

export function assertValidNewBranchName(name: string): void {
  if (!isValidBranchName(name)) throw new SandboxError(`fatal: '${name}' is not a valid branch name`)
}
