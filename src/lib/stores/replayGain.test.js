import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeReplayGain } from './replayGain.js'

test('no replayGain data returns unity gain', () => {
  assert.equal(computeReplayGain({}), 1)
  assert.equal(computeReplayGain({ replayGain: {} }), 1)
})

test('uses trackGain by default', () => {
  const gain = computeReplayGain({ replayGain: { trackGain: -6 } })
  assert.ok(Math.abs(gain - 10 ** (-6 / 20)) < 1e-9)
})

test('falls back to albumGain when trackGain is missing', () => {
  const gain = computeReplayGain({ replayGain: { albumGain: -3 } })
  assert.ok(Math.abs(gain - 10 ** (-3 / 20)) < 1e-9)
})

test('preferAlbum picks albumGain over trackGain', () => {
  const gain = computeReplayGain(
    { replayGain: { trackGain: -6, albumGain: -3 } },
    { preferAlbum: true }
  )
  assert.ok(Math.abs(gain - 10 ** (-3 / 20)) < 1e-9)
})

test('falls back to fallbackGain when neither track nor album gain present', () => {
  const gain = computeReplayGain({ replayGain: { fallbackGain: -10 } })
  assert.ok(Math.abs(gain - 10 ** (-10 / 20)) < 1e-9)
})

test('baseGain is added to the chosen gain', () => {
  const gain = computeReplayGain({ replayGain: { trackGain: -6, baseGain: 3 } })
  assert.ok(Math.abs(gain - 10 ** (-3 / 20)) < 1e-9)
})

test('positive gain is clamped so it never clips against the peak', () => {
  // +10dB would normally be a gain of ~3.16x, but a peak of 0.5 means we
  // can only safely apply up to 2x before clipping.
  const gain = computeReplayGain({ replayGain: { trackGain: 10, trackPeak: 0.5 } })
  assert.ok(Math.abs(gain - 2) < 1e-9)
})

test('peak clamping is skipped when no peak is provided', () => {
  const gain = computeReplayGain({ replayGain: { trackGain: 10 } })
  assert.ok(Math.abs(gain - 10 ** (10 / 20)) < 1e-9)
})
