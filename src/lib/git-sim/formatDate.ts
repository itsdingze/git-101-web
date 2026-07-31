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

export function formatGitDate(timestamp: number, timezoneOffset: number): string {
  const shifted = new Date((timestamp - timezoneOffset * 60) * 1000)
  const day = DAYS[shifted.getUTCDay()] ?? ''
  const month = MONTHS[shifted.getUTCMonth()] ?? ''
  const time = `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`
  return `${day} ${month} ${shifted.getUTCDate()} ${time} ${shifted.getUTCFullYear()} ${offsetLabel(timezoneOffset)}`
}
