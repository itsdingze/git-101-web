import type { CommandWord } from '@/lib/git-sim/input/tokenize'
import { messages } from '@/messages/en'
import { failed, printed, type Output, type TipRule } from './tipRule'
import { gitCommand } from './commandShape'

const NO_PUSH_DESTINATION = /No configured push destination/
const UNREACHABLE_ORIGIN = /^fatal: 'origin' does not appear to be a git repository/m
const REMOTE_EXISTS = /^error: remote origin already exists/m
const REPOSITORY_NOT_FOUND = /Repository not found/
const FORCED_UPDATE = /\(forced update\)/
const OWNER_AND_REPOSITORY = /^[\w-]+\/[\w.-]+$/
const WEB_ADDRESS = /^(https?:\/\/|git@)/
const tips = messages.sandbox.tips

export const missingRemoteTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'push' || !failed(outputs)) return null
  if (printed(outputs, NO_PUSH_DESTINATION)) return tips.noPushDestination
  if (printed(outputs, UNREACHABLE_ORIGIN)) return tips.unreachableOrigin
  return null
}

export const remoteExistsTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, REMOTE_EXISTS)) return null
  return tips.remoteExists
}

export const repositoryNotFoundTip: TipRule = ({ tokens, outputs }) => {
  if (!failed(outputs) || !printed(outputs, REPOSITORY_NOT_FOUND)) return null
  if (gitCommand(tokens) === 'clone') return tips.cloneRepositoryNotFound
  return tips.remoteRepositoryNotFound
}

export const forcePushTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'push' || !printed(outputs, FORCED_UPDATE)) return null
  return tips.forcePush
}

function cloneAddress(tokens: readonly CommandWord[], outputs: readonly Output[]): string | null {
  if (gitCommand(tokens) !== 'clone' || !failed(outputs)) return null
  return tokens.slice(2).find((token) => !token.raw.startsWith('-'))?.raw ?? null
}

export const cloneOwnerAndRepositoryTip: TipRule = ({ tokens, outputs }) => {
  const address = cloneAddress(tokens, outputs)
  if (!address || !OWNER_AND_REPOSITORY.test(address)) return null
  return tips.cloneOwnerAndRepository(address.replace(/\.git$/, ''))
}

export const cloneSchemeTip: TipRule = ({ tokens, outputs }) => {
  const address = cloneAddress(tokens, outputs)
  if (!address || WEB_ADDRESS.test(address) || !address.includes('.')) return null
  return tips.cloneScheme(address)
}
