// Pure helper for the "time of day" greeting mode — kept free of browser
// globals so it can run under plain Node in tests.

export function timeOfDayGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Good night.'
  if (hour < 12) return 'Good morning.'
  if (hour < 17) return 'Good afternoon.'
  if (hour < 22) return 'Good evening.'
  return 'Good night.'
}
