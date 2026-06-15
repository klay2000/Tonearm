import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeToMinutes, isDarkAt } from './themeSchedule.js'

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
