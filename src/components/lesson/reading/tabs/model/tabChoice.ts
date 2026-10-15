type PlatformHint = 'mac' | 'windows'

const PLATFORM_LABELS: Record<PlatformHint, RegExp> = {
  mac: /\bmac\b/i,
  windows: /\bwindows\b/i,
}

export function platformHint(userAgent: string): PlatformHint | null {
  if (/iphone|ipad|ipod/i.test(userAgent)) return null
  if (/macintosh/i.test(userAgent)) return 'mac'
  if (/windows/i.test(userAgent)) return 'windows'
  return null
}

export function initialTabIndex(
  labels: readonly string[],
  storedLabel: string | null,
  hint: PlatformHint | null,
): number {
  const stored = storedLabel === null ? -1 : labels.indexOf(storedLabel)
  if (stored !== -1) return stored

  const guessed = hint === null ? -1 : labels.findIndex((label) => PLATFORM_LABELS[hint].test(label))
  return guessed === -1 ? 0 : guessed
}
