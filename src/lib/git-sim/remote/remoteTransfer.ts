import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { copyTree, makeDirectory, pathExists } from '@/lib/git-sim/fs/fileOperations'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { writeShallowBoundary } from '@/lib/git-sim/history/shallowBoundary'
import { initRepository } from '@/lib/git-sim/history/initRepository'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { currentBranch, refOid } from '@/lib/git-sim/history/repository'
import { setUpstream } from './upstream'
import type { CommandContext, RemoteLink } from '@/lib/git-sim/types'

const REMOTES_ROOT = '/srv/remotes'

function remoteDirFor(name: string): string {
  return joinPath(REMOTES_ROOT, name)
}

async function remoteExists(ctx: CommandContext, name: string): Promise<boolean> {
  return pathExists(ctx.fs, joinPath(remoteDirFor(name), '.git'))
}

export async function createRemoteRepo(ctx: CommandContext, name: string): Promise<string> {
  const dir = remoteDirFor(name)
  if (!(await remoteExists(ctx, name))) {
    await initRepository(ctx, dir)
  }
  return dir
}

export async function copyObjects(
  ctx: CommandContext,
  fromDir: string,
  toDir: string,
): Promise<void> {
  await copyTree(ctx.fs, joinPath(fromDir, '.git/objects'), joinPath(toDir, '.git/objects'))
}

async function mirrorRemoteBranches(
  ctx: CommandContext,
  remote: RemoteLink,
  dir: string,
  only: string | null,
): Promise<void> {
  const fs = gitFs(ctx.fs)

  for (const name of await git.listBranches({ fs, dir: remote.dir })) {
    if (only !== null && name !== only) continue
    const oid = await refOid(ctx, remote.dir, `refs/heads/${name}`)
    if (!oid) continue
    await git.writeRef({
      fs,
      dir,
      ref: `refs/remotes/${remote.name}/${name}`,
      value: oid,
      force: true,
    })
  }
}

async function startTrackedBranch(
  ctx: CommandContext,
  remote: RemoteLink,
  dir: string,
  name: string,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  const oid = await refOid(ctx, dir, `refs/remotes/${remote.name}/${name}`)
  if (!oid) return

  await git.writeRef({ fs, dir, ref: `refs/heads/${name}`, value: oid, force: true })
  await setUpstream(ctx, dir, name, { remote: remote.name, branch: name })
}

type CloneOutcome = 'copied' | 'empty'

type CloneOptions = {
  branch?: string
  depth?: number
}

export async function hasRemoteBranch(ctx: CommandContext, remote: RemoteLink, branch: string): Promise<boolean> {
  return (await refOid(ctx, remote.dir, `refs/heads/${branch}`)) !== null
}

async function shallowBoundaryAt(ctx: CommandContext, dir: string, tip: string, depth: number): Promise<Set<string>> {
  const fs = gitFs(ctx.fs)
  const boundary = new Set<string>()
  let level = [tip]
  const seen = new Set(level)

  for (let distance = 1; distance <= depth && level.length > 0; distance += 1) {
    const next: string[] = []
    for (const oid of level) {
      const { commit } = await git.readCommit({ fs, dir, oid })
      if (distance === depth && commit.parent.length > 0) boundary.add(oid)
      for (const parent of commit.parent) {
        if (seen.has(parent)) continue
        seen.add(parent)
        next.push(parent)
      }
    }
    level = next
  }

  return boundary
}

export async function cloneInto(
  ctx: CommandContext,
  remote: RemoteLink,
  dir: string,
  options: CloneOptions = {},
): Promise<CloneOutcome> {
  const fs = gitFs(ctx.fs)
  await makeDirectory(ctx.fs, dir)
  await initRepository(ctx, dir)
  await copyObjects(ctx, remote.dir, dir)
  await git.addRemote({ fs, dir, remote: remote.name, url: remote.url })

  const head = options.branch ?? (await currentBranch(ctx, remote.dir)) ?? 'main'
  await mirrorRemoteBranches(ctx, remote, dir, options.depth === undefined ? null : head)

  const trackedOid = await refOid(ctx, dir, `refs/remotes/${remote.name}/${head}`)
  if (!trackedOid) {
    await setUpstream(ctx, dir, head, { remote: remote.name, branch: head })
    return 'empty'
  }

  await startTrackedBranch(ctx, remote, dir, head)
  await git.checkout({ fs, dir, ref: head, force: true })
  if (options.depth !== undefined) await writeShallowBoundary(ctx, dir, await shallowBoundaryAt(ctx, dir, trackedOid, options.depth))
  await recordHeadMove(ctx, dir)
  return 'copied'
}

