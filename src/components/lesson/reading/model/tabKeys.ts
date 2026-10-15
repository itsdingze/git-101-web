const TARGETS: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_, count) => count - 1,
}

export function tabKeyTarget(key: string, index: number, count: number): number | null {
  const target = TARGETS[key]
  return target ? target(index, count) : null
}
