import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeToMinutes, isDarkAt, msUntilNextSwitch } from './themeSchedule.js'

const HOUR = 60 * 60_000

test('timeToMinutes parses "HH:MM" into minutes since midnight', () => {
  assert.equal(timeToMinutes('00:00'), 0)
  assert.equal(timeToMinutes('07:00'), 420)
  assert.equal(timeToMinutes('20:00'), 1200)
  assert.equal(timeToMinutes('23:59'), 1439)
})

test('isDarkAt: dark period wraps midnight (dark 20:00 -> light 07:00)', () => {
  const darkStart = '20:00'
  const lightStart = '07:00'

  // Evening, after dark start: dark
  assert.equal(isDarkAt(new Date(2026, 5, 7, 21, 0), darkStart, lightStart), true)
  // Late night, still before light start: dark
  assert.equal(isDarkAt(new Date(2026, 5, 7, 2, 0), darkStart, lightStart), true)
  // Right at light start: no longer dark
  assert.equal(isDarkAt(new Date(2026, 5, 7, 7, 0), darkStart, lightStart), false)
  // Midday: light
  assert.equal(isDarkAt(new Date(2026, 5, 7, 12, 0), darkStart, lightStart), false)
  // Right at dark start: dark
  assert.equal(isDarkAt(new Date(2026, 5, 7, 20, 0), darkStart, lightStart), true)
})

test('isDarkAt: dark period within a single day (dark 02:00 -> light 07:00)', () => {
  const darkStart = '02:00'
  const lightStart = '07:00'

  assert.equal(isDarkAt(new Date(2026, 5, 7, 1, 0), darkStart, lightStart), false)
  assert.equal(isDarkAt(new Date(2026, 5, 7, 3, 0), darkStart, lightStart), true)
  assert.equal(isDarkAt(new Date(2026, 5, 7, 6, 59), darkStart, lightStart), true)
  assert.equal(isDarkAt(new Date(2026, 5, 7, 7, 0), darkStart, lightStart), false)
  assert.equal(isDarkAt(new Date(2026, 5, 7, 23, 0), darkStart, lightStart), false)
})

test('isDarkAt: equal dark/light times mean never dark', () => {
  assert.equal(isDarkAt(new Date(2026, 5, 7, 0, 0), '12:00', '12:00'), false)
  assert.equal(isDarkAt(new Date(2026, 5, 7, 12, 0), '12:00', '12:00'), false)
  assert.equal(isDarkAt(new Date(2026, 5, 7, 23, 59), '12:00', '12:00'), false)
})

test('msUntilNextSwitch: waits for the next boundary later the same day', () => {
  // 18:00, dark starts 20:00 -> 2h away (light at 07:00 is further off)
  assert.equal(msUntilNextSwitch(new Date(2026, 5, 7, 18, 0), '20:00', '07:00'), 2 * HOUR)
  // 21:30, next boundary is light at 07:00 tomorrow -> 9.5h
  assert.equal(msUntilNextSwitch(new Date(2026, 5, 7, 21, 30), '20:00', '07:00'), 9.5 * HOUR)
})

test('msUntilNextSwitch: wraps past midnight', () => {
  // 02:00, next boundary is light at 07:00 the same morning
  assert.equal(msUntilNextSwitch(new Date(2026, 5, 7, 2, 0), '20:00', '07:00'), 5 * HOUR)
  // 23:00 with both boundaries earlier in the day -> 07:00 tomorrow
  assert.equal(msUntilNextSwitch(new Date(2026, 5, 7, 23, 0), '02:00', '07:00'), 3 * HOUR)
})

test('msUntilNextSwitch: sitting exactly on a boundary waits for the next one', () => {
  // Guards against a 0ms timer looping: at 20:00 the next switch is 07:00.
  assert.equal(msUntilNextSwitch(new Date(2026, 5, 7, 20, 0), '20:00', '07:00'), 11 * HOUR)
})

test('msUntilNextSwitch: accounts for seconds within the current minute', () => {
  assert.equal(msUntilNextSwitch(new Date(2026, 5, 7, 19, 59, 30), '20:00', '07:00'), 30_000)
})

test('msUntilNextSwitch: equal dark/light times never switch', () => {
  assert.equal(msUntilNextSwitch(new Date(2026, 5, 7, 12, 0), '12:00', '12:00'), null)
})
