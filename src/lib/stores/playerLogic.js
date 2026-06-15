// Pure helpers for the player bar's time display — kept free of Svelte
// stores and browser globals so they can be unit-tested directly.

// Format seconds as m:ss. Treats Infinity/NaN/negative as unknown.
export function fmt(secs) {
  if (!secs || !isFinite(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// <audio>.duration is unreliable while a transcoded/chunked stream is
// loading (often Infinity or NaN until the full length is known). Only
// trust it once it's a finite, positive number; otherwise keep the
// previous value (e.g. the server-reported duration seeded on track change).
export function resolveDuration(audioDuration, previous) {
  return Number.isFinite(audioDuration) && audioDuration > 0 ? audioDuration : previous
}

// Last.fm/ListenBrainz scrobble convention: a track counts as "played" once
// it has been listened to for at least 4 minutes, or at least half its
// duration, whichever comes first. Returns false if duration is unknown.
export function shouldSubmitScrobble(elapsedSeconds, durationSeconds) {
  if (!isFinite(elapsedSeconds) || !isFinite(durationSeconds) || durationSeconds <= 0) return false
  const FOUR_MINUTES = 4 * 60
  return elapsedSeconds >= FOUR_MINUTES || elapsedSeconds >= durationSeconds / 2
}
