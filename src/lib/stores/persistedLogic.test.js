import { test } from 'node:test'
import assert from 'node:assert/strict'
import { codecFor, readPersisted } from './persistedLogic.js'

test('readPersisted falls back to the default when nothing is stored', () => {
  assert.equal(readPersisted(null, 'auto'), 'auto')
  assert.equal(readPersisted(null, true), true)
  assert.equal(readPersisted(null, 0), 0)
  assert.deepEqual(readPersisted(null, ['feat']), ['feat'])
})

test('booleans: only the opposite of the default flips the setting', () => {
  assert.equal(readPersisted('true', false), true)
  assert.equal(readPersisted('false', false), false)
  assert.equal(readPersisted('junk', false), false)

  assert.equal(readPersisted('false', true), false)
  assert.equal(readPersisted('true', true), true)
  assert.equal(readPersisted('junk', true), true)
})

test('numbers and strings round-trip', () => {
  const num = codecFor(0)
  assert.equal(readPersisted(num.serialize(320), 0), 320)
  assert.equal(readPersisted('dark', 'auto'), 'dark')
})

test('JSON values round-trip, and corrupt JSON falls back instead of throwing', () => {
  const json = codecFor([])
  assert.deepEqual(readPersisted(json.serialize(['feat', '&']), []), ['feat', '&'])
  assert.deepEqual(readPersisted('{not json', ['feat']), ['feat'])
})

test('a custom codec is used when supplied', () => {
  const codec = { parse: raw => Number(raw) * 2, serialize: String }
  assert.equal(readPersisted('2', 1, codec), 4)
})
