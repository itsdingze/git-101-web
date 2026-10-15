import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { copyTree, listEntries, makeDirectory, pathExists } from '@/lib/git-sim/fs/fileOperations'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { initRepository } from '@/lib/git-sim/history/initRepository'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { currentBranch, refOid } from '@/lib/git-sim/history/repository'
import { setUpstream } from './upstream'
import type { CommandContext, RemoteLink } from '@/lib/git-sim/types'

const REMOTES_ROOT = '/srv/remotes'
const OBJECT_BOOKKEEPING_DIRS = ['info', 'pack']

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
): Promise<void> {
  const fs = gitFs(ctx.fs)

  for (const name of await git.listBranches({ fs, dir: remote.dir })) {
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

export async function cloneInto(
  ctx: CommandContext,
  remote: RemoteLink,
  dir: string,
): Promise<CloneOutcome> {
  const fs = gitFs(ctx.fs)
  await makeDirectory(ctx.fs, dir)
  await initRepository(ctx, dir)
  await copyObjects(ctx, remote.dir, dir)
  await git.addRemote({ fs, dir, remote: remote.name, url: remote.url })
  await mirrorRemoteBranches(ctx, remote, dir)

  const head = (await currentBranch(ctx, remote.dir)) ?? 'main'
  if (!(await refOid(ctx, dir, `refs/remotes/${remote.name}/${head}`))) {
    await setUpstream(ctx, dir, head, { remote: remote.name, branch: head })
    return 'empty'
  }

  await startTrackedBranch(ctx, remote, dir, head)
  await git.checkout({ fs, dir, ref: head, force: true })
  await recordHeadMove(ctx, dir)
  return 'copied'
}

export async function countObjects(ctx: CommandContext, dir: string): Promise<number> {
  const objectsDir = joinPath(dir, '.git/objects')
  if (!(await pathExists(ctx.fs, objectsDir))) return 0

  const buckets = (await listEntries(ctx.fs, objectsDir)).filter(
    (entry) => entry.directory && !OBJECT_BOOKKEEPING_DIRS.includes(entry.name),
  )
  const sizes = await Promise.all(
    buckets.map(async (bucket) =>
      (await ctx.fs.promises.readdir(joinPath(objectsDir, bucket.name))).length,
    ),
  )

  return sizes.reduce((total, size) => total + size, 0)
}
