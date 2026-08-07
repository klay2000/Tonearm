import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clampScale, formatScale, MIN_SCALE, MAX_SCALE } from './uiScaleLogic.js'

test('clampScale falls back to 1x for missing or junk values', () => {
  assert.equal(clampScale(null), MIN_SCALE)
  assert.equal(clampScale(undefined), MIN_SCALE)
  assert.equal(clampScale(''), MIN_SCALE)
  assert.equal(clampScale('banana'), MIN_SCALE)
})

test('clampScale keeps values inside the slider range', () => {
  assert.equal(clampScale(0.2), MIN_SCALE)
  assert.equal(clampScale(-5), MIN_SCALE)
  assert.equal(clampScale(12), MAX_SCALE)
})

test('clampScale reads stored strings back as numbers', () => {
  assert.equal(clampScale('2'), 2)
  assert.equal(clampScale('1.5'), 1.5)
})

test('clampScale snaps to the 1x/2x/4x markers', () => {
  assert.equal(clampScale(1.05), 1)
  assert.equal(clampScale(1.95), 2)
  assert.equal(clampScale(2.06), 2)
  assert.equal(clampScale(3.93), 4)
})

test('clampScale leaves values between markers alone', () => {
  assert.equal(clampScale(1.5), 1.5)
  assert.equal(clampScale(2.5), 2.5)
  assert.equal(clampScale(3.24), 3.2)
})

test('formatScale drops trailing zeros', () => {
  assert.equal(formatScale(1), '1×')
  assert.equal(formatScale(1.5), '1.5×')
  assert.equal(formatScale(4), '4×')
})
