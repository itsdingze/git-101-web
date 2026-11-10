function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`
}

export function formatRelativeDate(timestamp: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp)
  if (seconds < 90) return plural(seconds, 'second')

  const minutes = Math.round(seconds / 60)
  if (minutes < 90) return plural(minutes, 'minute')

  const hours = Math.round(minutes / 60)
  if (hours < 36) return plural(hours, 'hour')

  const days = Math.round(hours / 24)
  if (days < 14) return plural(days, 'day')
  if (days < 70) return plural(Math.round(days / 7), 'week')
  if (days < 365) return plural(Math.round(days / 30), 'month')

  if (days < 1825) {
    const years = Math.floor(days / 365)
    const months = Math.round((days - years * 365) / 30)
    return months > 0 ? `${years} year${years === 1 ? '' : 's'}, ${plural(months, 'month')}` : plural(years, 'year')
  }
  return plural(Math.round(days / 365), 'year')
}
