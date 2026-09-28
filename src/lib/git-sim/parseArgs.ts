type TakesValue = (name: string, joined: string) => boolean

type Option = { name: string; value: string | undefined }

type Parsed = { options: Option[]; operands: string[] }

const SHORT_NAME = /^-[A-Za-z]$/
const LETTER = /^[A-Za-z]$/
const SHORT_FLAGS_TAKING_VALUE = ['-m', '-b', '-B', '-c', '-C', '-n']

function isFlag(arg: string): boolean {
  return arg.startsWith('-') && arg !== '-'
}

function shortOptions(token: string, takesValue: TakesValue): Option[] {
  const letters = [...token.slice(1)]
  const options: Option[] = []

  for (const [index, letter] of letters.entries()) {
    const name = `-${letter}`
    const joined = letters.slice(index + 1).join('')

    if (takesValue(name, joined)) {
      options.push({ name, value: joined === '' ? undefined : joined })
      break
    }
    if (!LETTER.test(letter)) break
    options.push({ name, value: undefined })
  }

  return options
}

function longOption(token: string): Option {
  const equals = token.indexOf('=')
  if (equals === -1) return { name: token, value: undefined }
  return { name: token.slice(0, equals), value: token.slice(equals + 1) }
}

function optionsIn(token: string, takesValue: TakesValue): Option[] {
  return token.startsWith('--') ? [longOption(token)] : shortOptions(token, takesValue)
}

function valueSlot(options: readonly Option[], takesValue: TakesValue): Option | undefined {
  const last = options[options.length - 1]
  if (!last || last.value !== undefined) return undefined
  return takesValue(last.name, '') ? last : undefined
}

function parseOptions(args: readonly string[], takesValue: TakesValue): Parsed {
  const options: Option[] = []
  const operands: string[] = []
  let slot: Option | undefined
  let ended = false

  for (const arg of args) {
    if (slot) {
      slot.value = arg
      slot = undefined
    } else if (ended || !isFlag(arg)) {
      operands.push(arg)
    } else if (arg === '--') {
      ended = true
    } else {
      const parsed = optionsIn(arg, takesValue)
      options.push(...parsed)
      slot = valueSlot(parsed, takesValue)
    }
  }

  return { options, operands }
}

export function operandsOf(args: readonly string[], valueFlags: readonly string[] = []): string[] {
  return parseOptions(args, (name) => valueFlags.includes(name)).operands
}

export function hasFlag(args: readonly string[], ...names: readonly string[]): boolean {
  if (args.some((arg) => names.includes(arg))) return true

  const undeclared: TakesValue = (name, joined) =>
    SHORT_NAME.test(name) &&
    !names.includes(name) &&
    (joined === '' || SHORT_FLAGS_TAKING_VALUE.includes(name))
  return parseOptions(args, undeclared).options.some((option) => names.includes(option.name))
}

export function flagValues(args: readonly string[], ...names: readonly string[]): string[] {
  const { options } = parseOptions(args, (name) => names.includes(name))
  return options.flatMap((option) =>
    names.includes(option.name) && option.value !== undefined ? [option.value] : [],
  )
}

export function flagValue(args: readonly string[], ...names: readonly string[]): string | undefined {
  return flagValues(args, ...names)[0]
}

export function unknownFlags(args: readonly string[], known: readonly string[]): string[] {
  const separator = args.indexOf('--')
  const named = separator === -1 ? args : args.slice(0, separator)
  return named.filter((arg) => isFlag(arg) && !known.includes(arg.split('=')[0] ?? arg))
}
