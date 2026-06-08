import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linearNextIndex, prevIndex, indexAfterMove, indexAfterRemove } from './queueLogic.js'

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
