export type KnownOptions = {
  flags: readonly string[]
  valueFlags?: readonly string[]
  countShorthand?: boolean
}

const COUNT_SHORTHAND = /^-\d+$/

function isKnown(arg: string, known: KnownOptions): boolean {
  if (known.flags.includes(arg) || known.valueFlags?.includes(arg)) return true
  if (known.countShorthand && COUNT_SHORTHAND.test(arg)) return true
  const [name] = arg.split('=')
  return arg.includes('=') && (known.valueFlags?.includes(name ?? '') ?? false)
}

export function firstUnknownOption(args: readonly string[], known: KnownOptions): string | null {
  for (const [index, arg] of args.entries()) {
    if (arg === '--') return null
    if (!arg.startsWith('-') || arg === '-') continue
    if (known.valueFlags?.includes(args[index - 1] ?? '')) continue
    if (!isKnown(arg, known)) return arg
  }
  return null
}
