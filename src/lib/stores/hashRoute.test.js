import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHash } from './hashRoute.js'

test('parseHash: empty or bare "#" hash routes to home', () => {
  assert.deepEqual(parseHash(''), { path: '/', params: {} })
  assert.deepEqual(parseHash('#'), { path: '/', params: {} })
})

test('parseHash: plain path with no query string', () => {
  assert.deepEqual(parseHash('#/artists'), { path: '/artists', params: {} })
})

test('parseHash: path with query params', () => {
  assert.deepEqual(parseHash('#/search?q=radiohead'), {
    path: '/search',
    params: { q: 'radiohead' },
  })
})

test('parseHash: multiple query params', () => {
  assert.deepEqual(parseHash('#/album?id=42&from=home'), {
    path: '/album',
    params: { id: '42', from: 'home' },
  })
})

test('parseHash: a literal "?" inside a param value is preserved', () => {
  // split('?') would otherwise truncate the value at the first "?" — the
  // rejoin (`rest.join('?')`) is what keeps the rest of the query string intact
  assert.deepEqual(parseHash('#/search?q=who?&genre=rock'), {
    path: '/search',
    params: { q: 'who?', genre: 'rock' },
  })
})
