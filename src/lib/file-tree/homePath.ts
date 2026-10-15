const HOME_FOLDERS = ['home', 'user'] as const
const SEPARATOR = '/'
const HOME_PATH = /^~(\/(?!\.{1,2}(\/|$))[^/]+)*$/

export function isHomePath(text: string): boolean {
  return HOME_PATH.test(text)
}

export function homePathFolders(path: string): string[] {
  return [...HOME_FOLDERS, ...path.split(SEPARATOR).slice(1)]
}
