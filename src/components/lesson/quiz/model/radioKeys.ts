const next = (index: number, count: number) => (index + 1) % count
const previous = (index: number, count: number) => (index - 1 + count) % count

const TARGETS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowDown: next,
  ArrowRight: next,
  ArrowUp: previous,
  ArrowLeft: previous,
  Home: () => 0,
  End: (_, count) => count - 1,
}

export function radioKeyTarget(key: string, index: number, count: number): number | null {
  const target = TARGETS[key]
  return target ? target(index, count) : null
}
