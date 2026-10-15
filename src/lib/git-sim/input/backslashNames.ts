export const NO_BACKSLASH_NAMES = "This practice terminal doesn't allow \\ in file or folder names."

export const LINE_CONTINUES =
  'A \\ at the end of a line tells a real terminal to wait for more. This practice terminal runs one line at a time, so leave it off.'

export function hasBackslash(name: string): boolean {
  return name.includes('\\')
}
