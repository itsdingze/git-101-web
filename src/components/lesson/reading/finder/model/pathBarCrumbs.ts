import type { FolderLocation } from '@/lib/file-tree/fileTree'

export interface PathCrumb {
  key: string
  kind: 'disk' | 'folder'
  name: string
  location: FolderLocation
}

const ROOT: PathCrumb = { key: '/', kind: 'disk', name: 'root', location: [] }

export function pathBarCrumbs(location: FolderLocation): PathCrumb[] {
  return [
    ROOT,
    ...location.map((name, index): PathCrumb => {
      const crumbLocation = location.slice(0, index + 1)
      return { key: `/${crumbLocation.join('/')}`, kind: 'folder', name, location: crumbLocation }
    }),
  ]
}
