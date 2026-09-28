import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists } from '@/lib/git-sim/fs/fileOperations'
import type { CommandContext } from '@/lib/git-sim/types'

export type UnmergedKind = 'both modified' | 'both added' | 'deleted by them' | 'deleted by us' | 'added by us' | 'added by them'

export type UnmergedEntry = {
  path: string
  kind: UnmergedKind
}

const HEADER_BYTES = 12
const FIXED_ENTRY_BYTES = 62
const OID_OFFSET = 40
const OID_BYTES = 20
const EXTENDED_FLAG = 0x4000
const NAME_MASK = 0xfff

function kindOf(stages: ReadonlySet<number>): UnmergedKind {
  const base = stages.has(1)
  const ours = stages.has(2)
  const theirs = stages.has(3)
  if (base && ours && theirs) return 'both modified'
  if (base && ours) return 'deleted by them'
  if (base && theirs) return 'deleted by us'
  if (ours && theirs) return 'both added'
  return ours ? 'added by us' : 'added by them'
}

function hexOf(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function stagesByPath(bytes: Uint8Array): Map<string, Map<number, string>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const count = view.getUint32(8)
  const decoder = new TextDecoder()
  const found = new Map<string, Map<number, string>>()

  let offset = HEADER_BYTES
  for (let entry = 0; entry < count; entry += 1) {
    const flags = view.getUint16(offset + 60)
    const nameStart = offset + FIXED_ENTRY_BYTES + (flags & EXTENDED_FLAG ? 2 : 0)
    let nameEnd = nameStart + (flags & NAME_MASK)
    if ((flags & NAME_MASK) === NAME_MASK) nameEnd = bytes.indexOf(0, nameStart)

    const stage = (flags >> 12) & 3
    if (stage > 0) {
      const path = decoder.decode(bytes.subarray(nameStart, nameEnd))
      const oid = hexOf(bytes.subarray(offset + OID_OFFSET, offset + OID_OFFSET + OID_BYTES))
      found.set(path, (found.get(path) ?? new Map<number, string>()).set(stage, oid))
    }

    const length = nameEnd - offset
    offset += length + 8 - (length % 8)
  }
  return found
}

export async function readUnmergedStages(ctx: CommandContext, dir: string): Promise<Map<string, Map<number, string>>> {
  const path = joinPath(dir, '.git/index')
  if (!(await pathExists(ctx.fs, path))) return new Map()

  const contents = await ctx.fs.promises.readFile(path)
  if (typeof contents === 'string' || contents.byteLength < HEADER_BYTES) return new Map()
  return stagesByPath(contents)
}

export async function readUnmergedEntries(ctx: CommandContext, dir: string): Promise<UnmergedEntry[]> {
  return [...(await readUnmergedStages(ctx, dir))]
    .map(([entryPath, stages]) => ({ path: entryPath, kind: kindOf(new Set(stages.keys())) }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
}
