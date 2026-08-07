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

// Milliseconds from `now` until the next dark/light transition, so a running
// app can sleep exactly until the theme needs to flip instead of polling.
// Returns null when the two times are equal (no transition ever happens).
export function msUntilNextSwitch(now, darkStart, lightStart) {
  const darkMin = timeToMinutes(darkStart)
  const lightMin = timeToMinutes(lightStart)

  if (darkMin === lightMin) return null

  const DAY = 24 * 60 * 60 * 1000
  const nowMs =
    now.getHours() * 3_600_000 +
    now.getMinutes() * 60_000 +
    now.getSeconds() * 1_000 +
    now.getMilliseconds()

  // Next boundary strictly after now, wrapping to tomorrow if both have passed.
  return Math.min(
    ...[darkMin, lightMin]
      .map(min => min * 60_000)
      .map(ms => (ms > nowMs ? ms - nowMs : ms + DAY - nowMs))
  )
}
