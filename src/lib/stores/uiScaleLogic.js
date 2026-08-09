// Pure helpers for the kiosk interface scale — no browser globals, so they
// can run under plain Node in tests.

export const MIN_SCALE = 1
export const MAX_SCALE = 4
export const SCALE_STEP = 0.1

// Slider positions worth calling out on the track.
export const SCALE_MARKERS = [1, 2, 4]

// Snap to a marker when the slider lands close to one, so 1x/2x/4x are easy to
// hit by hand rather than needing a pixel-perfect drag.
const SNAP_WITHIN = 0.08

// Coerce anything (a localStorage string, a slider value, junk) into a usable
// scale, falling back to 1x.
export function clampScale(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return MIN_SCALE

  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, n))
  const marker = SCALE_MARKERS.find(m => Math.abs(clamped - m) <= SNAP_WITHIN)
  if (marker !== undefined) return marker

  // Keep one decimal place so the stored value matches the slider's step.
  return Math.round(clamped * 10) / 10
}

// "1x" / "1.5x" for display.
export function formatScale(scale) {
  return `${Number(scale.toFixed(1))}×`
}
