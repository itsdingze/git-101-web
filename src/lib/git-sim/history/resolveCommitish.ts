import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { refOid } from './repository'
import { readHeadHistory } from './headHistory'
import { readShallowBoundary } from './shallowBoundary'
import type { CommandContext } from '@/lib/git-sim/types'

const SUFFIX = /^(.*?)((?:[~^]\d*)*)$/
const ABBREVIATED_OID = /^[0-9a-f]{4,40}$/
const REFLOG_POSITION = /^HEAD@\{(\d+)\}$/

type AncestorStep = { parent: number; times: number }

function ancestorStepsFrom(suffix: string): AncestorStep[] {
  return [...suffix.matchAll(/([~^])(\d*)/g)].map(([, symbol, digits]) => {
    const count = Number(digits || '1')
    return symbol === '~' ? { parent: 1, times: count } : { parent: count, times: 1 }
  })
}

async function expandedOid(ctx: CommandContext, dir: string, spec: string): Promise<string | null> {
  if (!ABBREVIATED_OID.test(spec)) return null
  try {
    return await git.expandOid({ fs: gitFs(ctx.fs), dir, oid: spec })
  } catch (error) {
    if (error instanceof git.Errors.AmbiguousError) {
      throw new SandboxError(`error: short object ID ${spec} is ambiguous`)
    }
    return null
  }
}

async function reflogOid(ctx: CommandContext, dir: string, position: number): Promise<string> {
  const moves = await readHeadHistory(ctx, dir)
  const oid = moves[moves.length - 1 - position]
  if (!oid) throw new SandboxError(`fatal: log for 'HEAD' only has ${moves.length} entries`)
  return oid
}

async function baseOid(ctx: CommandContext, dir: string, spec: string): Promise<string | null> {
  const position = REFLOG_POSITION.exec(spec)?.[1]
  if (position !== undefined) return reflogOid(ctx, dir, Number(position))
  if (spec === '@') return refOid(ctx, dir, 'HEAD')
  return (await refOid(ctx, dir, spec)) ?? (await expandedOid(ctx, dir, spec))
}

async function ancestorOid(
  ctx: CommandContext,
  dir: string,
  oid: string,
  steps: readonly AncestorStep[],
): Promise<string | null> {
  if (steps.length === 0) return oid

  const hidden = await readShallowBoundary(ctx, dir)
  let current = oid
  for (const { parent, times } of steps) {
    if (parent === 0) continue
    for (let step = 0; step < times; step += 1) {
      if (hidden.has(current)) return null
      const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: current })
      const next = commit.parent[parent - 1]
      if (!next) return null
      current = next
    }
  }
  return current
}

export async function resolveCommitish(
  ctx: CommandContext,
  dir: string,
  spec: string,
): Promise<string | null> {
  const match = SUFFIX.exec(spec)
  const oid = await baseOid(ctx, dir, match?.[1] || spec)
  if (!oid) return null

  return ancestorOid(ctx, dir, oid, ancestorStepsFrom(match?.[2] ?? ''))
}
