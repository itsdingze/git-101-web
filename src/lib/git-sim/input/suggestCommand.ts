function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0] ?? 0
    previous[0] = row

    for (let column = 1; column <= right.length; column += 1) {
      const candidate = previous[column] ?? 0
      const substitution = diagonal + (left[row - 1] === right[column - 1] ? 0 : 1)
      previous[column] = Math.min(candidate + 1, (previous[column - 1] ?? 0) + 1, substitution)
      diagonal = candidate
    }
  }

  return previous[right.length] ?? 0
}

export function suggestCommand(input: string, known: readonly string[]): string | null {
  const ranked = known
    .map((candidate) => ({ candidate, distance: editDistance(input, candidate) }))
    .filter((entry) => entry.distance <= Math.max(2, Math.floor(input.length / 3)))
    .sort((a, b) => a.distance - b.distance)

  return ranked[0]?.candidate ?? null
}
