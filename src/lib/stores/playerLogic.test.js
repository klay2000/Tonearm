import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fmt, resolveDuration } from './playerLogic.js'

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
