import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSubsonicResponse, AuthError } from './subsonicLogic.js'

test('parseSubsonicResponse returns the body on success', () => {
  const root = { status: 'ok', artists: { index: [] } }
  assert.equal(parseSubsonicResponse(root), root)
})

test('parseSubsonicResponse throws AuthError for bad credentials (code 40)', () => {
  const root = { status: 'failed', error: { code: 40, message: 'Wrong username or password.' } }
  assert.throws(() => parseSubsonicResponse(root), AuthError)
  assert.throws(() => parseSubsonicResponse(root), { message: 'Wrong username or password.' })
})

test('parseSubsonicResponse throws a plain Error for other failures', () => {
  const root = { status: 'failed', error: { code: 70, message: 'Data not found' } }
  assert.throws(() => parseSubsonicResponse(root), err => {
    assert.equal(err instanceof AuthError, false)
    assert.equal(err.message, 'Data not found')
    return true
  })
})
