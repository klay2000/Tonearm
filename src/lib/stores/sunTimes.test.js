import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localDateString, sunriseSunsetUrl, isDarkAt } from './sunTimes.js'

test('localDateString reports the local calendar date, not the UTC one', () => {
  // Late evening on Jan 1 in a timezone behind UTC is already Jan 2 in UTC —
  // we must report the date the user is actually living in (Jan 1).
  const lateLocalNight = new Date(2026, 0, 1, 23, 30)
  assert.equal(localDateString(lateLocalNight), '2026-01-01')

  const earlyLocalMorning = new Date(2026, 5, 7, 0, 30)
  assert.equal(localDateString(earlyLocalMorning), '2026-06-07')
})

test('sunriseSunsetUrl always pins an explicit date', () => {
  // sunrise-sunset.org defaults `date` to "today" in UTC, which is the wrong
  // day for large parts of the world at any given moment. The request must
  // always carry an explicit date so the API can't fall back to that default.
  const url = sunriseSunsetUrl(21.3069, -157.8583, '2026-06-07')
  assert.match(url, /[?&]date=2026-06-07(&|$)/)
  assert.match(url, /[?&]lat=21\.3069(&|$)/)
  assert.match(url, /[?&]lng=-157\.8583(&|$)/)
})

test('isDarkAt: midday between sunrise and sunset is light', () => {
  const rise = new Date('2026-06-07T15:47:27Z')
  const set = new Date('2026-06-08T05:13:22Z')
  assert.equal(isDarkAt(new Date('2026-06-07T22:00:00Z'), rise, set), false)
})

test('isDarkAt: before sunrise or after sunset is dark', () => {
  const rise = new Date('2026-06-07T15:47:27Z')
  const set = new Date('2026-06-08T05:13:22Z')
  assert.equal(isDarkAt(new Date('2026-06-07T10:00:00Z'), rise, set), true)
  assert.equal(isDarkAt(new Date('2026-06-08T10:00:00Z'), rise, set), true)
})

test('regression: an Honolulu afternoon is not reported as dark', () => {
  // "now": 2026-06-08T02:05Z == 2026-06-07 16:05 in Honolulu (UTC-10) — broad daylight.
  const now = new Date('2026-06-08T02:05:20Z')

  // Correct sun times for Honolulu's actual local date (2026-06-07):
  const correctRise = new Date('2026-06-07T15:47:27Z')
  const correctSet = new Date('2026-06-08T05:13:22Z')
  assert.equal(isDarkAt(now, correctRise, correctSet), false)

  // This is what the old code got back: it relied on the API's default
  // "today", which is the UTC date (2026-06-08) — a day that, for Honolulu,
  // hasn't started yet. Its "sunrise" was still hours in the future, so
  // `now < rise` was true and the UI flipped to dark mode in broad daylight.
  const apiDefaultRise = new Date('2026-06-08T15:47:28Z')
  const apiDefaultSet = new Date('2026-06-09T05:13:44Z')
  assert.equal(isDarkAt(now, apiDefaultRise, apiDefaultSet), true)
})
