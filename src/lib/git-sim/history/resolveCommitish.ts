import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { refOid } from './repository'
import { readHeadHistory } from './headHistory'
import type { CommandContext } from '@/lib/git-sim/types'

const SUFFIX = /^(.*?)((?:[~^]\d*)*)$/
const ABBREVIATED_OID = /^[0-9a-f]{4,40}$/
const REFLOG_POSITION = /^HEAD@\{(\d+)\}$/

function stepsFrom(suffix: string): number {
  let steps = 0
  for (const [, symbol, digits] of suffix.matchAll(/([~^])(\d*)/g)) {
    steps += symbol === '~' ? Number(digits || '1') : 1
  }
  return steps
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
  const move = moves[moves.length - 1 - position]
  if (!move) throw new SandboxError(`fatal: log for 'HEAD' only has ${moves.length} entries`)
  return move.oid
}

async function baseOid(ctx: CommandContext, dir: string, spec: string): Promise<string | null> {
  const position = REFLOG_POSITION.exec(spec)?.[1]
  if (position !== undefined) return reflogOid(ctx, dir, Number(position))
  return (await refOid(ctx, dir, spec)) ?? (await expandedOid(ctx, dir, spec))
}

async function ancestorOid(
  ctx: CommandContext,
  dir: string,
  oid: string,
  steps: number,
): Promise<string | null> {
  let current = oid
  for (let taken = 0; taken < steps; taken += 1) {
    const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: current })
    const parent = commit.parent[0]
    if (!parent) return null
    current = parent
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

  return ancestorOid(ctx, dir, oid, stepsFrom(match?.[2] ?? ''))
}
