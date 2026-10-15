export function hintAfterWrongCheck(index: number, hintCount: number, hintShown: boolean): number {
  if (!hintShown) return index
  return Math.min(index + 1, Math.max(hintCount - 1, 0))
}
