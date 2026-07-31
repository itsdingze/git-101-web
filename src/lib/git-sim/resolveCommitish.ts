import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { refOid } from './repository'
import type { CommandContext } from './types'

const SUFFIX = /^(.*?)((?:[~^]\d*)*)$/

function stepsFrom(suffix: string): number {
  let steps = 0
  for (const [, symbol, digits] of suffix.matchAll(/([~^])(\d*)/g)) {
    steps += symbol === '~' ? Number(digits || '1') : 1
  }
  return steps
}

export async function resolveCommitish(
  ctx: CommandContext,
  dir: string,
  spec: string,
): Promise<string | null> {
  const match = SUFFIX.exec(spec)
  const base = match?.[1] || spec
  const steps = stepsFrom(match?.[2] ?? '')

  let oid = await refOid(ctx, dir, base)
  if (!oid) return null

  for (let taken = 0; taken < steps; taken += 1) {
    const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
    const parent = commit.parent[0]
    if (!parent) return null
    oid = parent
  }

  return oid
}
