import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { currentBranch, headOid, refOid } from '@/lib/git-sim/history/repository'
import { STASH_REF } from '@/lib/git-sim/stash/stashLog'
import type { CommandContext } from '@/lib/git-sim/types'

export type RefDecorations = Map<string, string[]>

export async function readDecorations(
  ctx: CommandContext,
  dir: string,
): Promise<RefDecorations> {
  const decorations: RefDecorations = new Map()
  const attach = (oid: string, label: string, first = false) => {
    const labels = decorations.get(oid) ?? []
    if (first) labels.unshift(label)
    else labels.push(label)
    decorations.set(oid, labels)
  }

  const branch = await currentBranch(ctx, dir)
  const head = await headOid(ctx, dir)
  const named: { ref: string; label: string }[] = []

  for (const name of await git.listBranches({ fs: gitFs(ctx.fs), dir })) {
    if (name !== branch) named.push({ ref: `refs/heads/${name}`, label: name })
  }
  for (const { remote } of await git.listRemotes({ fs: gitFs(ctx.fs), dir })) {
    for (const name of await git.listBranches({ fs: gitFs(ctx.fs), dir, remote })) {
      named.push({ ref: `refs/remotes/${remote}/${name}`, label: `${remote}/${name}` })
    }
  }
  named.push({ ref: STASH_REF, label: STASH_REF })

  named.sort((a, b) => (a.ref < b.ref ? 1 : a.ref > b.ref ? -1 : 0))
  for (const { ref, label } of named) {
    const oid = await refOid(ctx, dir, ref)
    if (oid) attach(oid, label)
  }

  if (branch) {
    const oid = await refOid(ctx, dir, `refs/heads/${branch}`)
    if (oid) attach(oid, `HEAD -> ${branch}`, true)
  } else if (head) {
    attach(head, 'HEAD', true)
  }

  return decorations
}

export function decorationLabel(decorations: RefDecorations, oid: string): string {
  const labels = decorations.get(oid)
  return labels && labels.length > 0 ? ` (${labels.join(', ')})` : ''
}
