export type CollapseBoundary = (path: string) => string | null

const COLLAPSE_FROM_TOP: CollapseBoundary = () => ''

function outermostUntrackedFolder(path: string, tracked: readonly string[], boundary: string): string {
  const parts = path.split('/')
  const firstDepth = boundary === '' ? 1 : boundary.split('/').length
  for (let depth = firstDepth; depth < parts.length; depth += 1) {
    const folder = `${parts.slice(0, depth).join('/')}/`
    if (!tracked.some((trackedPath) => trackedPath.startsWith(folder))) return folder
  }
  return path
}

export function collapseUntrackedFolders(
  untracked: readonly string[],
  tracked: readonly string[],
  boundaryOf: CollapseBoundary = COLLAPSE_FROM_TOP,
): string[] {
  return [
    ...new Set(
      untracked.map((path) => {
        const boundary = boundaryOf(path)
        return boundary === null ? path : outermostUntrackedFolder(path, tracked, boundary)
      }),
    ),
  ]
}
