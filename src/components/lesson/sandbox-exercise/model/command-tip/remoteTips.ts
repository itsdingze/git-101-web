import type { CommandWord } from '@/lib/git-sim/input/tokenize'
import { failed, printed, type Output, type TipRule } from './tipRule'
import { gitCommand } from './commandShape'

const NO_PUSH_DESTINATION = /No configured push destination/
const UNREACHABLE_ORIGIN = /^fatal: 'origin' does not appear to be a git repository/m
const REMOTE_EXISTS = /^error: remote origin already exists/m
const REPOSITORY_NOT_FOUND = /Repository not found/
const FORCED_UPDATE = /\(forced update\)/
const OWNER_AND_REPOSITORY = /^[\w-]+\/[\w.-]+$/
const WEB_ADDRESS = /^(https?:\/\/|git@)/

export const missingRemoteTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'push' || !failed(outputs)) return null
  if (printed(outputs, NO_PUSH_DESTINATION)) {
    return "This project isn't connected to GitHub yet, so there's nowhere to send it. Connect it first with `git remote add origin <url>`, using the address of your GitHub repository, then try again."
  }
  if (printed(outputs, UNREACHABLE_ORIGIN)) {
    return "Git can't reach `origin`. Run `git remote -v`: if nothing is listed, add it with `git remote add origin <url>`. If the address looks wrong, press Start over and add the right one."
  }
  return null
}

export const remoteExistsTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, REMOTE_EXISTS)) return null
  return '`origin` already has an address. Check it with `git remote -v`. If it looks wrong, press Start over and add the right one.'
}

export const repositoryNotFoundTip: TipRule = ({ tokens, outputs }) => {
  if (!failed(outputs) || !printed(outputs, REPOSITORY_NOT_FOUND)) return null
  if (gitCommand(tokens) === 'clone') {
    return "Git couldn't find a repository at that address. Check it for typos, then run `git clone` again."
  }
  return "Git couldn't find a repository at that address. Check it for typos with `git remote -v`. If it's wrong, press Start over and add the right one."
}

export const forcePushTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'push' || !printed(outputs, FORCED_UPDATE)) return null
  return "That replaced GitHub's copy with yours, so any commits your teammates pushed are gone from it. Pull instead of forcing. If a goal can no longer be met, press Start over."
}

function cloneAddress(tokens: readonly CommandWord[], outputs: readonly Output[]): string | null {
  if (gitCommand(tokens) !== 'clone' || !failed(outputs)) return null
  return tokens.slice(2).find((token) => !token.raw.startsWith('-'))?.raw ?? null
}

export const cloneOwnerAndRepositoryTip: TipRule = ({ tokens, outputs }) => {
  const address = cloneAddress(tokens, outputs)
  if (!address || !OWNER_AND_REPOSITORY.test(address)) return null
  const name = address.replace(/\.git$/, '')
  return `Git needs the full address. Run \`gh repo clone ${name}\`, or \`git clone https://github.com/${name}.git\`.`
}

export const cloneSchemeTip: TipRule = ({ tokens, outputs }) => {
  const address = cloneAddress(tokens, outputs)
  if (!address || WEB_ADDRESS.test(address) || !address.includes('.')) return null
  return `A web address needs its start too: \`git clone https://${address}\``
}
