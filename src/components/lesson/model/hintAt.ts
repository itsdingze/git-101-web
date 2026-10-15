export function hintAt(hints: readonly string[], index: number): string {
  return hints[Math.min(index, hints.length - 1)] ?? ''
}
