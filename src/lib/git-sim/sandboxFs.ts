import { Buffer } from 'buffer'
import type { PromiseFsClient } from 'isomorphic-git'
import { createMemoryFs, type SandboxFs, type SandboxStats } from './memoryFs'

export type { SandboxFs, SandboxStats }

/** isomorphic-git reaches for a global `Buffer`, which browsers do not provide. */
function installBufferGlobal(): void {
  const scope = globalThis as typeof globalThis & { Buffer?: typeof Buffer }
  scope.Buffer ??= Buffer
}

export function createSandboxFs(): SandboxFs {
  installBufferGlobal()
  return createMemoryFs()
}

/** isomorphic-git types its fs methods as bare `Function`, so the cast lands here once. */
export function gitFs(fs: SandboxFs): PromiseFsClient {
  return fs as unknown as PromiseFsClient
}
