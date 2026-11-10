const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function offsetLabel(timezoneOffset: number): string {
  const sign = timezoneOffset > 0 ? '-' : '+'
  const total = Math.abs(timezoneOffset)
  return `${sign}${pad(Math.floor(total / 60))}${pad(total % 60)}`
}

function shiftedDate(timestamp: number, timezoneOffset: number): Date {
  return new Date((timestamp - timezoneOffset * 60) * 1000)
}

function clockTime(date: Date): string {
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}

export function formatShortDate(timestamp: number, timezoneOffset: number): string {
  const date = shiftedDate(timestamp, timezoneOffset)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function formatGitDate(timestamp: number, timezoneOffset: number): string {
  const date = shiftedDate(timestamp, timezoneOffset)
  const day = DAYS[date.getUTCDay()] ?? ''
  const month = MONTHS[date.getUTCMonth()] ?? ''
  return `${day} ${month} ${date.getUTCDate()} ${clockTime(date)} ${date.getUTCFullYear()} ${offsetLabel(timezoneOffset)}`
}

export function formatIsoDate(timestamp: number, timezoneOffset: number): string {
  const date = shiftedDate(timestamp, timezoneOffset)
  return `${formatShortDate(timestamp, timezoneOffset)} ${clockTime(date)} ${offsetLabel(timezoneOffset)}`
}

export function formatStrictIsoDate(timestamp: number, timezoneOffset: number): string {
  const date = shiftedDate(timestamp, timezoneOffset)
  const label = offsetLabel(timezoneOffset)
  const zone = timezoneOffset === 0 ? 'Z' : `${label.slice(0, 3)}:${label.slice(3)}`
  return `${formatShortDate(timestamp, timezoneOffset)}T${clockTime(date)}${zone}`
}

export function formatRfc2822Date(timestamp: number, timezoneOffset: number): string {
  const date = shiftedDate(timestamp, timezoneOffset)
  const day = DAYS[date.getUTCDay()] ?? ''
  const month = MONTHS[date.getUTCMonth()] ?? ''
  return `${day}, ${date.getUTCDate()} ${month} ${date.getUTCFullYear()} ${clockTime(date)} ${offsetLabel(timezoneOffset)}`
}

export function timeWithOffset(timestamp: number, timezoneOffset: number): string {
  return `${timestamp} ${offsetLabel(timezoneOffset)}`
}
