import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { currentBranch, headOid, refOid } from '@/lib/git-sim/repository'
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

  for (const name of await git.listBranches({ fs: gitFs(ctx.fs), dir })) {
    const oid = await refOid(ctx, dir, `refs/heads/${name}`)
    if (!oid) continue
    if (name === branch) attach(oid, `HEAD -> ${name}`, true)
    else attach(oid, name)
  }

  for (const { remote } of await git.listRemotes({ fs: gitFs(ctx.fs), dir })) {
    for (const name of await git.listBranches({ fs: gitFs(ctx.fs), dir, remote })) {
      const oid = await refOid(ctx, dir, `refs/remotes/${remote}/${name}`)
      if (oid) attach(oid, `${remote}/${name}`)
    }
  }

  if (!branch && head) attach(head, 'HEAD', true)

  return decorations
}

export function decorationLabel(decorations: RefDecorations, oid: string): string {
  const labels = decorations.get(oid)
  return labels && labels.length > 0 ? ` (${labels.join(', ')})` : ''
}
