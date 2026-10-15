function outermostUntrackedFolder(path: string, tracked: readonly string[]): string {
  const parts = path.split('/')
  for (let depth = 1; depth < parts.length; depth += 1) {
    const folder = `${parts.slice(0, depth).join('/')}/`
    if (!tracked.some((trackedPath) => trackedPath.startsWith(folder))) return folder
  }
  return path
}

export function collapseUntrackedFolders(untracked: readonly string[], tracked: readonly string[]): string[] {
  return [...new Set(untracked.map((path) => outermostUntrackedFolder(path, tracked)))]
}
