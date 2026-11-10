import git from 'isomorphic-git'
import type { ReadCommitResult } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { listEntries, pathExists } from '@/lib/git-sim/fs/fileOperations'
import type { CommandContext } from '@/lib/git-sim/types'

type StoredObject = { oid: string; bytes: number }

type PackSummary = { objects: number; compressed: number; deltas: number; bytes: number }

type LoadedObject = { type: string; content: Uint8Array }

const OBJECTS_FOLDER = '.git/objects'
const OBJECT_BOOKKEEPING_DIRS = ['info', 'pack']
const SMALLEST_DELTA_CANDIDATE = 50
const DELTA_WINDOW = 10
const DELTA_HEADER_BYTES = 20

export async function listObjectIds(ctx: CommandContext, dir: string): Promise<string[]> {
  const objectsDir = joinPath(dir, OBJECTS_FOLDER)
  if (!(await pathExists(ctx.fs, objectsDir))) return []

  const oids: string[] = []
  for (const bucket of await listEntries(ctx.fs, objectsDir)) {
    if (!bucket.directory || OBJECT_BOOKKEEPING_DIRS.includes(bucket.name)) continue
    for (const name of await ctx.fs.promises.readdir(joinPath(objectsDir, bucket.name))) oids.push(`${bucket.name}${name}`)
  }
  return oids
}

export async function measureObjects(ctx: CommandContext, dir: string, oids: Iterable<string>): Promise<StoredObject[]> {
  const objectsDir = joinPath(dir, OBJECTS_FOLDER)
  const stored: StoredObject[] = []
  for (const oid of oids) {
    const { size } = await ctx.fs.promises.stat(joinPath(objectsDir, `${oid.slice(0, 2)}/${oid.slice(2)}`))
    stored.push({ oid, bytes: size })
  }
  return stored
}

export async function listStoredObjects(ctx: CommandContext, dir: string): Promise<StoredObject[]> {
  return measureObjects(ctx, dir, await listObjectIds(ctx, dir))
}

async function collectTree(ctx: CommandContext, dir: string, oid: string, found: Set<string>): Promise<void> {
  if (found.has(oid)) return
  found.add(oid)

  const { tree } = await git.readTree({ fs: gitFs(ctx.fs), dir, oid })
  for (const entry of tree) {
    if (entry.type === 'tree') await collectTree(ctx, dir, entry.oid, found)
    else found.add(entry.oid)
  }
}

async function snapshotObjectIds(ctx: CommandContext, dir: string, commits: readonly ReadCommitResult[]): Promise<Set<string>> {
  const found = new Set<string>()
  for (const { oid, commit } of commits) {
    found.add(oid)
    await collectTree(ctx, dir, commit.tree, found)
  }
  return found
}

export async function listHistoryObjects(ctx: CommandContext, dir: string): Promise<StoredObject[]> {
  const history = await git.log({ fs: gitFs(ctx.fs), dir, ref: 'HEAD' })
  return measureObjects(ctx, dir, await snapshotObjectIds(ctx, dir, history))
}

export async function listBranchTipObjectIds(ctx: CommandContext, dir: string): Promise<string[]> {
  const fs = gitFs(ctx.fs)
  const tips: ReadCommitResult[] = []
  for (const branch of await git.listBranches({ fs, dir })) {
    tips.push(await git.readCommit({ fs, dir, oid: await git.resolveRef({ fs, dir, ref: `refs/heads/${branch}` }) }))
  }
  return [...(await snapshotObjectIds(ctx, dir, tips))]
}

async function loadObject(ctx: CommandContext, dir: string, oid: string): Promise<LoadedObject | null> {
  const { object, type } = await git.readObject({ fs: gitFs(ctx.fs), dir, oid, format: 'content' })
  return object instanceof Uint8Array ? { type, content: object } : null
}

async function loadCandidates(ctx: CommandContext, dir: string, oids: readonly string[]): Promise<LoadedObject[]> {
  const loaded: LoadedObject[] = []
  for (const oid of oids) {
    const object = await loadObject(ctx, dir, oid)
    if (object && object.content.length >= SMALLEST_DELTA_CANDIDATE) loaded.push(object)
  }
  return loaded.sort((a, b) => b.content.length - a.content.length)
}

function sharedEnds(target: Uint8Array, base: Uint8Array): number {
  const limit = Math.min(target.length, base.length)
  let prefix = 0
  while (prefix < limit && target[prefix] === base[prefix]) prefix += 1
  let suffix = 0
  while (suffix < limit - prefix && target[target.length - 1 - suffix] === base[base.length - 1 - suffix]) suffix += 1
  return prefix + suffix
}

function isWorthDeltifying(target: Uint8Array, base: Uint8Array): boolean {
  const deltaSize = target.length - sharedEnds(target, base) + DELTA_HEADER_BYTES
  return deltaSize < target.length / 2 - DELTA_HEADER_BYTES
}

function countDeltas(candidates: readonly LoadedObject[], thinBases: readonly LoadedObject[]): number {
  let deltas = 0
  candidates.forEach((candidate, index) => {
    const sameType = (bases: readonly LoadedObject[]) => bases.filter(({ type }) => type === candidate.type).slice(0, DELTA_WINDOW)
    const window = [...sameType(candidates.slice(Math.max(0, index - DELTA_WINDOW), index)), ...sameType(thinBases)]
    if (window.some((base) => isWorthDeltifying(candidate.content, base.content))) deltas += 1
  })
  return deltas
}

export async function summarizePack(
  ctx: CommandContext,
  dir: string,
  sent: readonly StoredObject[],
  deltaBases: readonly string[],
): Promise<PackSummary> {
  const candidates = await loadCandidates(ctx, dir, sent.map(({ oid }) => oid))
  return {
    objects: sent.length,
    compressed: candidates.length,
    deltas: countDeltas(candidates, await loadCandidates(ctx, dir, deltaBases)),
    bytes: sent.reduce((total, { bytes }) => total + bytes, 0),
  }
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
}

function humanRate(bytes: number): string {
  const perMillisecond = bytes / Math.max(1, Math.ceil(bytes / 1024))
  return perMillisecond < 1024 ? `${perMillisecond.toFixed(2)} KiB/s` : `${(perMillisecond / 1024).toFixed(2)} MiB/s`
}

function totalLine({ objects, deltas }: PackSummary): string {
  return `Total ${objects} (delta ${deltas}), reused 0 (delta 0), pack-reused 0 (from 0)`
}

function compressingLines(compressed: number): string[] {
  return compressed > 1 ? ['Delta compression using up to 12 threads', `Compressing objects: 100% (${compressed}/${compressed}), done.`] : []
}

export function pushProgressLines(summary: PackSummary, enumerated: number): string[] {
  if (summary.objects === 0) return [totalLine(summary)]
  return [
    `Enumerating objects: ${enumerated}, done.`,
    `Counting objects: 100% (${enumerated}/${enumerated}), done.`,
    ...compressingLines(summary.compressed),
    `Writing objects: 100% (${summary.objects}/${summary.objects}), ${humanSize(summary.bytes)} | ${humanRate(summary.bytes)}, done.`,
    totalLine(summary),
  ]
}

export function cloneProgressLines(summary: PackSummary): string[] {
  const { objects, compressed, deltas } = summary
  return [
    `remote: Enumerating objects: ${objects}, done.`,
    `remote: Counting objects: 100% (${objects}/${objects}), done.`,
    ...(compressed > 1 ? [`remote: Compressing objects: 100% (${compressed}/${compressed}), done.`] : []),
    `remote: ${totalLine(summary)}`,
    `Receiving objects: 100% (${objects}/${objects}), done.`,
    ...(deltas > 0 ? [`Resolving deltas: 100% (${deltas}/${deltas}), done.`] : []),
  ]
}
