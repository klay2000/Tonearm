// Pure helpers for the auto (sunrise/sunset) theme — kept free of browser
// globals so they can run under plain Node in tests.

// sunrise-sunset.org defaults its `date` param to "today" in UTC. For anyone
// whose local calendar date differs from the UTC date (i.e. most of the
// world, for part of every day), that returns the wrong day's sun times. We
// always pass the date explicitly, computed from the LOCAL calendar date.
export function localDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function sunriseSunsetUrl(lat, lon, dateStr) {
  return `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`
}

export function isDarkAt(now, rise, set) {
  return now < rise || now > set
}
