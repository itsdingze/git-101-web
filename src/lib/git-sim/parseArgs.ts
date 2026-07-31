export function isFlag(arg: string): boolean {
  return arg.startsWith('-') && arg !== '-'
}

export function operandsOf(args: readonly string[]): string[] {
  return args.filter((arg) => !isFlag(arg) && arg !== '--')
}

export function hasFlag(args: readonly string[], ...names: readonly string[]): boolean {
  return args.some((arg) => names.includes(arg))
}

export function flagValue(args: readonly string[], ...names: readonly string[]): string | undefined {
  for (const name of names) {
    const inline = args.find((arg) => arg.startsWith(`${name}=`))
    if (inline) return inline.slice(name.length + 1)

    const index = args.indexOf(name)
    if (index !== -1) return args[index + 1]
  }
  return undefined
}

export function unknownFlags(args: readonly string[], known: readonly string[]): string[] {
  return args.filter((arg) => isFlag(arg) && !known.includes(arg.split('=')[0] ?? arg))
}
