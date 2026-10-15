function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0
  let value = Math.imul(next ^ (next >>> 15), 1 | next)
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
  return [((value ^ (value >>> 14)) >>> 0) / 4294967296, next]
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const pool = [...items]
  const order: T[] = []
  let state = hashSeed(seed)

  while (pool.length > 0) {
    const [random, nextState] = nextRandom(state)
    state = nextState
    order.push(...pool.splice(Math.floor(random * pool.length), 1))
  }

  return order
}
