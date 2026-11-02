import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linearNextIndex, prevIndex, indexAfterMove, indexAfterRemove, randomOtherIndex, shuffledAroundCurrent, tagEntries } from './queueLogic.js'

test('linearNextIndex advances within the queue', () => {
  assert.equal(linearNextIndex(0, 3, 'off'), 1)
  assert.equal(linearNextIndex(1, 3, 'off'), 2)
})

test('linearNextIndex at the end of the queue: wraps with repeat-all, holds otherwise', () => {
  assert.equal(linearNextIndex(2, 3, 'all'), 0)
  assert.equal(linearNextIndex(2, 3, 'off'), 2)
  // 'one' is handled by the <audio> ended-event listener, not playNext —
  // here it should behave like 'off' (no advance past the end).
  assert.equal(linearNextIndex(2, 3, 'one'), 2)
})

test('prevIndex steps back but never below zero', () => {
  assert.equal(prevIndex(2), 1)
  assert.equal(prevIndex(0), 0)
})

test('indexAfterMove: dragging the playing track follows it to its new slot', () => {
  assert.equal(indexAfterMove(2, 2, 0), 0)
  assert.equal(indexAfterMove(2, 2, 4), 4)
})

test('indexAfterMove: dragging another track across the playing one shifts it by one', () => {
  // item moves from before the playing track to after (or onto) it — playing
  // track shifts left to fill the gap
  assert.equal(indexAfterMove(2, 0, 3), 1)
  // item moves from after the playing track to before (or onto) it — playing
  // track shifts right to make room
  assert.equal(indexAfterMove(2, 4, 1), 3)
})

test('indexAfterMove: moves entirely on one side of the playing track leave it untouched', () => {
  assert.equal(indexAfterMove(2, 0, 1), 2)
  assert.equal(indexAfterMove(2, 4, 5), 2)
})

test('indexAfterRemove: removing a track before the playing one shifts it left', () => {
  assert.equal(indexAfterRemove(2, 0, 3), 1)
})

test('indexAfterRemove: removing a track after the playing one leaves it untouched', () => {
  assert.equal(indexAfterRemove(2, 3, 3), 2)
})

test('indexAfterRemove: removing the playing track clamps to the new last index', () => {
  // playing track removed mid-queue — pointer holds its slot, now occupied by
  // the next track
  assert.equal(indexAfterRemove(1, 1, 3), 1)
  // playing track was last — pointer clamps to the new last index
  assert.equal(indexAfterRemove(2, 2, 2), 1)
  // queue emptied entirely
  assert.equal(indexAfterRemove(0, 0, 0), -1)
})

// Feeds a fixed sequence of Math.random-style values.
const sequence = values => () => values.shift()

test('randomOtherIndex never picks the current track', () => {
  // first roll lands on the current index (1) and must be re-rolled
  assert.equal(randomOtherIndex(1, 3, sequence([0.4, 0.9])), 2)
  assert.equal(randomOtherIndex(1, 3, sequence([0.1])), 0)
})

test('shuffledAroundCurrent puts the playing track first and keeps every track', () => {
  const q = ['a', 'b', 'c', 'd', 'e']
  const out = shuffledAroundCurrent(q, 2)
  assert.equal(out[0], 'c')
  assert.deepEqual([...out].sort(), [...q].sort())
  assert.deepEqual(q, ['a', 'b', 'c', 'd', 'e'], 'input queue is not mutated')
})

// Regression: the queue used to be keyed on song id, so "play next" on a song
// already in the queue crashed the queue panel (duplicate #each key) and
// stalled playback when it was reached (same id looked like "no change").
test('tagEntries gives the same song a distinct key each time it is queued', () => {
  const song = { id: 's1', title: 'Song' }
  const [a, b] = tagEntries([song, song], 10)
  assert.equal(a.id, b.id)
  assert.notEqual(a.queueKey, b.queueKey)
  assert.deepEqual([a.queueKey, b.queueKey], [10, 11])
  assert.equal(song.queueKey, undefined, 'input track is not mutated')
})
