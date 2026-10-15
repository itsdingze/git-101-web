export interface SandboxFiles {
  conflictFiles: readonly string[]
  read: (path: string) => Promise<string>
  save: (path: string, contents: string) => void
}
