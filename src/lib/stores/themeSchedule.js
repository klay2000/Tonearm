// Pure helpers for the auto (scheduled) theme — kept free of browser
// globals so they can run under plain Node in tests.

// Parse a "HH:MM" string into minutes since midnight.
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Given the current time and the user-configured "dark starts at" /
// "light starts at" times (each "HH:MM", local time), decide whether it
// should currently be dark.
//
// The dark period runs from `darkStart` to `lightStart`, wrapping past
// midnight when `darkStart` is later in the day than `lightStart` (the
// common case, e.g. dark at 20:00, light at 07:00). If the two times are
// equal, there's no dark period at all (always light).
export function isDarkAt(now, darkStart, lightStart) {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const darkMin = timeToMinutes(darkStart)
  const lightMin = timeToMinutes(lightStart)

  if (darkMin === lightMin) return false

  if (darkMin < lightMin) {
    // Dark period falls entirely within one day, e.g. 02:00 -> 07:00
    return nowMin >= darkMin && nowMin < lightMin
  }

  // Dark period wraps past midnight, e.g. 20:00 -> 07:00 (next day)
  return nowMin >= darkMin || nowMin < lightMin
}
