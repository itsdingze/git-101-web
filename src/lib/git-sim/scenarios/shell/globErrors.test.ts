import { describe, expect, it, vi } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'

vi.mock('@/lib/git-sim/fs/memoryFs', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/git-sim/fs/memoryFs')>()
  return {
    ...original,
    createMemoryFs: () => {
      const fs = original.createMemoryFs()
      const readdir = fs.promises.readdir.bind(fs.promises)
      fs.promises.readdir = async (path: string) => {
        if (path.endsWith('/unreadable')) throw new Error('EIO: i/o error, scandir')
        return readdir(path)
      }
      return fs
    },
  }
})

describe('a glob whose folder cannot be read', () => {
  it('prints the failure as an error line instead of rejecting the run', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ write: { 'unreadable/a.txt': 'a\n' } }] })

    const result = await sandbox.run('echo unreadable/*')

    expect(result.outputs.map((output) => output.stream)).toEqual(['stderr'])
  })
})
