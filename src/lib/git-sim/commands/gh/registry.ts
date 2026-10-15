import { authLogin } from './authLogin'
import { authStatus } from './authStatus'
import { repoClone } from './repoClone'
import { prCreate } from './prCreate'
import { prView } from './prView'
import { prMerge } from './prMerge'
import type { GhCommandHandler } from '@/lib/git-sim/types'

export const GH_COMMANDS: Readonly<Record<string, Readonly<Record<string, GhCommandHandler>>>> = {
  auth: { login: authLogin, status: authStatus },
  repo: { clone: repoClone },
  pr: { create: prCreate, view: prView, merge: prMerge },
}
