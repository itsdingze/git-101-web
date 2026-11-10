export type KnownOptions = {
  flags: readonly string[]
  valueFlags?: readonly string[]
  attachedValueFlags?: readonly string[]
  trailingValueFlags?: readonly string[]
  countShorthand?: boolean
  singleLetterOnly?: boolean
}

export type CommandLine = {
  operands: readonly string[]
  beforeDashes: readonly string[]
  afterDashes: readonly string[]
  has: (...names: readonly string[]) => boolean
  value: (...names: readonly string[]) => string | undefined
  values: (...names: readonly string[]) => string[]
  count: (...names: readonly string[]) => number
  lastOf: (...names: readonly string[]) => string | undefined
}

type ParsedCommandLine = {
  line: CommandLine
  unknownOption: string | null
  missingValue: string | null
  helpRequested: boolean
}

type Option = { name: string; value: string | undefined }

type Reading = { options: Option[]; takesNext: Option | null } | null

const COUNT_SHORTHAND = /^-\d+$/

function isOption(arg: string): boolean {
  return arg.startsWith('-') && arg !== '-'
}

function isAmong(names: readonly string[] | undefined, name: string): boolean {
  return names?.includes(name) ?? false
}

function readLong(token: string, known: KnownOptions, isLast: boolean): Reading {
  const equals = token.indexOf('=')
  const name = equals === -1 ? token : token.slice(0, equals)
  const option: Option = { name, value: equals === -1 ? undefined : token.slice(equals + 1) }

  if (isAmong(known.flags, name)) return option.value === undefined ? { options: [option], takesNext: null } : null
  if (isAmong(known.attachedValueFlags, name)) return { options: [option], takesNext: null }
  if (isAmong(known.valueFlags, name)) return { options: [option], takesNext: option.value === undefined ? option : null }
  if (isAmong(known.trailingValueFlags, name)) {
    return { options: [option], takesNext: option.value === undefined && !isLast ? option : null }
  }
  return null
}

function readShort(token: string, known: KnownOptions): Reading {
  if (known.countShorthand && COUNT_SHORTHAND.test(token)) {
    return { options: [{ name: '-n', value: token.slice(1) }], takesNext: null }
  }

  const options: Option[] = []
  const letters = [...token.slice(1)]
  for (const [index, letter] of letters.entries()) {
    const name = `-${letter}`
    const joined = letters.slice(index + 1).join('')
    const value = joined === '' ? undefined : joined

    if (isAmong(known.valueFlags, name)) {
      const option = { name, value }
      return { options: [...options, option], takesNext: value === undefined ? option : null }
    }
    if (isAmong(known.attachedValueFlags, name)) return { options: [...options, { name, value }], takesNext: null }
    if (!isAmong(known.flags, name) || (known.singleLetterOnly && value !== undefined)) return null
    options.push({ name, value: undefined })
  }
  return { options, takesNext: null }
}

function lastItem<T>(items: readonly T[]): T | undefined {
  return items[items.length - 1]
}

function commandLineOf(options: readonly Option[], beforeDashes: readonly string[], afterDashes: readonly string[]): CommandLine {
  const named = (names: readonly string[]) => options.filter((option) => names.includes(option.name))
  const values = (...names: readonly string[]) =>
    named(names).flatMap((option) => (option.value === undefined ? [] : [option.value]))

  return {
    operands: [...beforeDashes, ...afterDashes],
    beforeDashes,
    afterDashes,
    has: (...names) => named(names).length > 0,
    value: (...names) => lastItem(values(...names)),
    values,
    count: (...names) => named(names).length,
    lastOf: (...names) => lastItem(named(names))?.name,
  }
}

export function parseCommandLine(args: readonly string[], known: KnownOptions): ParsedCommandLine {
  const options: Option[] = []
  const beforeDashes: string[] = []
  const afterDashes: string[] = []
  let pending: Option | null = null
  let ended = false
  let unknownOption: string | null = null
  let helpRequested = false

  for (const [index, arg] of args.entries()) {
    if (pending) {
      pending.value = arg
      pending = null
    } else if (ended) {
      afterDashes.push(arg)
    } else if (!isOption(arg)) {
      beforeDashes.push(arg)
    } else if (arg === '--') {
      ended = true
    } else if (arg === '--help' || arg === '-h') {
      helpRequested = true
    } else {
      const reading = arg.startsWith('--') ? readLong(arg, known, index === args.length - 1) : readShort(arg, known)
      if (reading) {
        options.push(...reading.options)
        pending = reading.takesNext
      } else {
        unknownOption ??= arg
      }
    }
  }

  return {
    line: commandLineOf(options, beforeDashes, afterDashes),
    unknownOption,
    missingValue: pending?.name ?? null,
    helpRequested,
  }
}
