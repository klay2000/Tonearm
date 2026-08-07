import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fmt, resolveDuration, shouldSubmitScrobble, canSeekTo } from './playerLogic.js'

test('fmt formats whole minutes and seconds', () => {
  assert.equal(fmt(0), '0:00')
  assert.equal(fmt(65), '1:05')
  assert.equal(fmt(3661), '61:01')
})

test('fmt treats Infinity, NaN and falsy values as unknown', () => {
  assert.equal(fmt(Infinity), '0:00')
  assert.equal(fmt(NaN), '0:00')
  assert.equal(fmt(0), '0:00')
  assert.equal(fmt(undefined), '0:00')
})

test('resolveDuration keeps the previous value when audio.duration is not finite', () => {
  // Regression: transcoded/chunked streams report Infinity or NaN for
  // audio.duration while loading, which previously flickered the display
  // through "Infinity:NaN" and "0:00" before settling on the real value.
  assert.equal(resolveDuration(Infinity, 215), 215)
  assert.equal(resolveDuration(NaN, 215), 215)
  assert.equal(resolveDuration(0, 215), 215)
})

test('resolveDuration adopts a finite positive audio.duration', () => {
  assert.equal(resolveDuration(217.4, 215), 217.4)
})

test('shouldSubmitScrobble is false before either threshold is reached', () => {
  // 3 min into a 10 min track: under 4 min and under 50%
  assert.equal(shouldSubmitScrobble(180, 600), false)
})

test('shouldSubmitScrobble becomes true at 50% for short tracks', () => {
  // 90s into a 3 min track: 50% reached, but under 4 min
  assert.equal(shouldSubmitScrobble(90, 180), true)
  assert.equal(shouldSubmitScrobble(89, 180), false)
})

test('shouldSubmitScrobble becomes true at 4 minutes for long tracks', () => {
  // 4 min into a 20 min track: under 50%, but the 4 min cap is reached
  assert.equal(shouldSubmitScrobble(240, 1200), true)
  assert.equal(shouldSubmitScrobble(239, 1200), false)
})

test('shouldSubmitScrobble is false when duration is unknown', () => {
  assert.equal(shouldSubmitScrobble(300, 0), false)
  assert.equal(shouldSubmitScrobble(300, NaN), false)
  assert.equal(shouldSubmitScrobble(300, Infinity), false)
})

// Stand-in for the browser's TimeRanges.
function ranges(...pairs) {
  return {
    length: pairs.length,
    start: i => pairs[i][0],
    end: i => pairs[i][1],
  }
}

test('canSeekTo allows a target inside a buffered range', () => {
  assert.equal(canSeekTo(ranges([0, 240]), 120), true)
  assert.equal(canSeekTo(ranges([0, 240]), 0), true)
  assert.equal(canSeekTo(ranges([0, 240]), 240), true)
})

test('canSeekTo refuses a target outside every range', () => {
  assert.equal(canSeekTo(ranges([0, 60]), 200), false)
  assert.equal(canSeekTo(ranges([100, 200]), 20), false)
})

test('canSeekTo refuses an unseekable stream (regression: #105)', () => {
  // A chunked transcode reports no seekable ranges at all; seeking it anyway
  // wedged the kiosk's media pipeline and took play/pause down with it.
  assert.equal(canSeekTo(ranges(), 30), false)
  assert.equal(canSeekTo(null, 30), false)
  assert.equal(canSeekTo(undefined, 30), false)
})

test('canSeekTo refuses non-finite targets', () => {
  assert.equal(canSeekTo(ranges([0, 240]), NaN), false)
  assert.equal(canSeekTo(ranges([0, 240]), Infinity), false)
})

test('canSeekTo checks every range, not just the first', () => {
  assert.equal(canSeekTo(ranges([0, 30], [100, 200]), 150), true)
  assert.equal(canSeekTo(ranges([0, 30], [100, 200]), 60), false)
})
