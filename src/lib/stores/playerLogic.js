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

// Whether a seek to `target` is actually possible on a media element.
//
// A server-side transcode arrives chunked, with no Content-Length and no
// Accept-Ranges, so the stream isn't byte-seekable. On the kiosk (WebKitGTK /
// GStreamer) assigning currentTime anyway leaves the pipeline stuck in a seek
// that never completes, which takes play/pause down with it — so check first
// and skip the seek rather than wedge playback.
//
// `seekable` is a TimeRanges (or anything with the same length/start/end
// shape). A tiny tolerance covers ranges reported a hair short of the target.
export function canSeekTo(seekable, target) {
  if (!seekable || !Number.isFinite(target)) return false

  const TOLERANCE = 0.5
  for (let i = 0; i < seekable.length; i++) {
    if (target >= seekable.start(i) - TOLERANCE && target <= seekable.end(i) + TOLERANCE) {
      return true
    }
  }
  return false
}

// Decide how to reach `target` (a position in the *track*) given what the
// media element can do.
//
// `streamOffset` is how many seconds into the track the currently-loaded
// stream begins, so the element's own clock reads `target - streamOffset`.
//
//  - 'element' — the stream is seekable, so just assign currentTime.
//  - 'reload'  — it isn't (a chunked transcode), so re-request the stream
//                starting at the target with `timeOffset` and reset the base.
export function planSeek(seekable, target, streamOffset = 0) {
  const clamped = Math.max(0, target)
  const elementTime = clamped - streamOffset

  if (canSeekTo(seekable, elementTime)) {
    return { mode: 'element', time: elementTime, offset: streamOffset }
  }
  return { mode: 'reload', time: 0, offset: Math.floor(clamped) }
}

// Last.fm/ListenBrainz scrobble convention: a track counts as "played" once
// it has been listened to for at least 4 minutes, or at least half its
// duration, whichever comes first. Returns false if duration is unknown.
export function shouldSubmitScrobble(elapsedSeconds, durationSeconds) {
  if (!isFinite(elapsedSeconds) || !isFinite(durationSeconds) || durationSeconds <= 0) return false
  const FOUR_MINUTES = 4 * 60
  return elapsedSeconds >= FOUR_MINUTES || elapsedSeconds >= durationSeconds / 2
}
