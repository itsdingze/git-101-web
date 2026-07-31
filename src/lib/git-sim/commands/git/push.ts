import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { currentBranch, refOid, shortOid } from '@/lib/git-sim/repository'
import { copyObjects, remoteDirFor, remoteExists, remoteUrl } from '@/lib/git-sim/remoteTransfer'
import { resolveRemoteName } from './fetch'
import type { CommandContext } from '@/lib/git-sim/types'
import type { GitSubcommand } from '@/lib/git-sim/types'

const TRANSFER_NOISE = [
  'Enumerating objects: 5, done.',
  'Counting objects: 100% (5/5), done.',
  'Writing objects: 100% (3/3), done.',
]

function rejection(url: string, branch: string): string {
  return [
    `To ${url}`,
    ` ! [rejected]        ${branch} -> ${branch} (fetch first)`,
    `error: failed to push some refs to '${url}'`,
    'hint: Updates were rejected because the remote contains work that you do',
    'hint: not have locally. This is usually caused by another repository pushing',
    "hint: to the same ref. You may want to first integrate the remote changes",
    "hint: (e.g., 'git pull ...') before pushing again.",
  ].join('\n')
}

async function canFastForward(
  ctx: CommandContext,
  dir: string,
  localOid: string,
  remoteOid: string,
): Promise<boolean> {
  if (localOid === remoteOid) return true
  return git.isDescendent({ fs: gitFs(ctx.fs), dir, oid: localOid, ancestor: remoteOid, depth: -1 })
}

export const push: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const operands = operandsOf(args)
    const branchName = await currentBranch(ctx, dir)
    if (!branchName) throw new SandboxError('fatal: cannot push a detached HEAD in this course.')

    const remoteName = operands[0] ?? (await resolveRemoteName(ctx, dir))
    const branch = operands[1] ?? branchName
    const url = await remoteUrl(ctx, dir, remoteName)

    if (!(await remoteExists(ctx, remoteName))) {
      throw new SandboxError(
        [`fatal: '${url}' does not appear to be a git repository`, 'fatal: Could not read from remote repository.'].join('\n'),
      )
    }

    const localOid = await refOid(ctx, dir, `refs/heads/${branch}`)
    if (!localOid) throw new SandboxError(`error: src refspec ${branch} does not match any`)

    const remoteDir = remoteDirFor(ctx, remoteName)
    await copyObjects(ctx, remoteDir, dir)
    const remoteOid = await refOid(ctx, remoteDir, `refs/heads/${branch}`)

    if (remoteOid && !(await canFastForward(ctx, dir, localOid, remoteOid))) {
      throw new SandboxError(rejection(url, branch))
    }

    await copyObjects(ctx, dir, remoteDir)
    await git.writeRef({
      fs: gitFs(ctx.fs),
      dir: remoteDir,
      ref: `refs/heads/${branch}`,
      value: localOid,
      force: true,
    })
    await git.writeRef({
      fs: gitFs(ctx.fs),
      dir,
      ref: `refs/remotes/${remoteName}/${branch}`,
      value: localOid,
      force: true,
    })

    const tracked = hasFlag(args, '-u', '--set-upstream')
    if (tracked) {
      await git.setConfig({ fs: gitFs(ctx.fs), dir, path: `branch.${branch}.remote`, value: remoteName })
      await git.setConfig({
        fs: gitFs(ctx.fs),
        dir,
        path: `branch.${branch}.merge`,
        value: `refs/heads/${branch}`,
      })
    }

    const refLine = remoteOid
      ? `   ${shortOid(remoteOid)}..${shortOid(localOid)}  ${branch} -> ${branch}`
      : ` * [new branch]      ${branch} -> ${branch}`
    const upstream = tracked
      ? [`branch '${branch}' set up to track '${remoteName}/${branch}'.`]
      : []

    return say([...TRANSFER_NOISE, `To ${url}`, refLine, ...upstream].join('\n'))
  },
}
