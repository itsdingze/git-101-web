import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { copyTree, listEntries, makeDirectory, pathExists } from './fileOperations'
import { recordHeadMove } from './headHistory'
import { joinPath } from './paths'
import { currentBranch, refOid } from './repository'
import { setUpstream } from './upstream'
import type { CommandContext, RemoteLink } from './types'

const REMOTES_ROOT = '.remotes'
const OBJECT_BOOKKEEPING_DIRS = ['info', 'pack']

function remoteDirFor(ctx: CommandContext, name: string): string {
  return joinPath(ctx.root, `${REMOTES_ROOT}/${name}`)
}

async function remoteExists(ctx: CommandContext, name: string): Promise<boolean> {
  return pathExists(ctx.fs, joinPath(remoteDirFor(ctx, name), '.git'))
}

export async function createRemoteRepo(ctx: CommandContext, name: string): Promise<string> {
  const dir = remoteDirFor(ctx, name)
  if (!(await remoteExists(ctx, name))) {
    await git.init({ fs: gitFs(ctx.fs), dir, defaultBranch: 'main' })
  }
  return dir
}

/** Git objects are content addressed, so a blind directory copy is a valid transfer. */
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

export async function cloneInto(
  ctx: CommandContext,
  remote: RemoteLink,
  dir: string,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  await makeDirectory(ctx.fs, dir)
  await git.init({ fs, dir, defaultBranch: 'main' })
  await copyObjects(ctx, remote.dir, dir)
  await git.addRemote({ fs, dir, remote: remote.name, url: remote.url })
  await mirrorRemoteBranches(ctx, remote, dir)

  const head = (await currentBranch(ctx, remote.dir)) ?? 'main'
  await startTrackedBranch(ctx, remote, dir, head)
  await git.checkout({ fs, dir, ref: head, force: true })
  await recordHeadMove(ctx, dir, `clone: from ${remote.url}`)
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
