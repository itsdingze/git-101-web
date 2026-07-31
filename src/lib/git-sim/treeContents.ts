import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { readText, pathExists } from './fileOperations'
import { joinPath } from './paths'
import type { CommandContext } from './types'

type IndexEntry = { path: string; oid: string }

const decoder = new TextDecoder()

async function blobText(ctx: CommandContext, dir: string, oid: string): Promise<string> {
  const { blob } = await git.readBlob({ fs: gitFs(ctx.fs), dir, oid })
  return decoder.decode(blob)
}

export async function readCommitFiles(
  ctx: CommandContext,
  dir: string,
  ref: string,
): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  const paths = await git.listFiles({ fs: gitFs(ctx.fs), dir, ref })
  for (const path of paths) {
    const { blob } = await git.readBlob({ fs: gitFs(ctx.fs), dir, oid: ref, filepath: path })
    files.set(path, decoder.decode(blob))
  }
  return files
}

export async function readIndexFiles(
  ctx: CommandContext,
  dir: string,
): Promise<Map<string, string>> {
  const entries = (await git.walk({
    fs: gitFs(ctx.fs),
    dir,
    trees: [git.STAGE()],
    map: async (filepath, nodes) => {
      const entry = nodes[0]
      if (!entry || filepath === '.') return undefined
      if ((await entry.type()) !== 'blob') return undefined
      const oid = await entry.oid()
      return oid ? { path: filepath, oid } : undefined
    },
  })) as IndexEntry[]

  const files = new Map<string, string>()
  for (const entry of entries) {
    files.set(entry.path, await blobText(ctx, dir, entry.oid))
  }
  return files
}

export async function readWorkdirFiles(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  for (const path of paths) {
    const absolute = joinPath(dir, path)
    if (await pathExists(ctx.fs, absolute)) {
      files.set(path, await readText(ctx.fs, absolute))
    }
  }
  return files
}
