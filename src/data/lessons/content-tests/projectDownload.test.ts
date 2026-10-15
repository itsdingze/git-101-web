import { Buffer } from 'buffer'
import archiveUrl from '/public/downloads/todo-app.zip?url&inline'
import { describe, expect, it } from 'vitest'
import { createSandbox, type SeedStep } from '@/lib/git-sim/createSandbox'
import story from '@/data/lessons/story.yaml'

async function archiveFiles(zip: Buffer): Promise<Record<string, string>> {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  expect(end).toBeGreaterThanOrEqual(0)
  const count = zip.readUInt16LE(end + 10)
  let cursor = zip.readUInt32LE(end + 16)
  const files: Record<string, string> = {}

  for (let index = 0; index < count; index += 1) {
    expect(zip.readUInt32LE(cursor)).toBe(0x02014b50)
    const method = zip.readUInt16LE(cursor + 10)
    const size = zip.readUInt32LE(cursor + 20)
    const nameLength = zip.readUInt16LE(cursor + 28)
    const extraLength = zip.readUInt16LE(cursor + 30)
    const commentLength = zip.readUInt16LE(cursor + 32)
    const local = zip.readUInt32LE(cursor + 42)
    const name = new TextDecoder().decode(zip.subarray(cursor + 46, cursor + 46 + nameLength))
    cursor += 46 + nameLength + extraLength + commentLength
    if (name.endsWith('/')) continue

    expect(name).toMatch(/^todo-app\/[^/]+$/)
    expect([0, 8]).toContain(method)
    const dataStart = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
    const compressed = zip.subarray(dataStart, dataStart + size)
    const contents = method === 8
      ? await new Response(
          new Blob([new Uint8Array(compressed)]).stream().pipeThrough(new DecompressionStream('deflate-raw')),
        ).text()
      : new TextDecoder().decode(compressed)
    files[name.slice('todo-app/'.length)] = contents
  }
  return files
}

describe('downloadable todo-app', () => {
  it('contains the completed practice project without Git history', async () => {
    const encoded = archiveUrl.split(',')[1]
    if (!encoded) throw new Error('Expected an inline archive asset')
    const files = await archiveFiles(Buffer.from(encoded, 'base64'))
    const sandbox = await createSandbox({
      dir: 'projects/todo-app',
      setup: story['team-after-teammates-changes'] as SeedStep[],
    })
    const expected: Record<string, string> = {}
    for (const path of (await sandbox.snapshot()).workdirPaths) {
      expected[path] = await sandbox.readFile(path)
    }
    expect(files).toEqual(expected)
    expect(files['.gitignore']).toContain('tasks.txt')
    expect(files['.gitignore']).toContain('*.log')
  })
})
