// Pure index-arithmetic helpers for queue navigation/reordering — kept free of
// Svelte stores and browser globals so they can be unit-tested directly.
// player.js calls these and writes the results back into its stores.

// Where playback should land after the current track ends, ignoring shuffle
// (random-next picks its own index via Math.random and has no "pure" form).
export function linearNextIndex(current, length, repeat) {
  if (current < length - 1) return current + 1
  if (repeat === 'all') return 0
  return current
}

export function prevIndex(current) {
  return Math.max(0, current - 1)
}

// Where the playing-track pointer should land after dragging an item from
// `from` to `to` in the queue.
export function indexAfterMove(current, from, to) {
  if (from === current) return to
  if (from < current && to >= current) return current - 1
  if (from > current && to <= current) return current + 1
  return current
}

// Where the playing-track pointer should land after removing the item at
// `removed`, given the queue's length after removal.
export function indexAfterRemove(current, removed, newLength) {
  if (removed < current) return current - 1
  if (removed === current) return Math.min(current, newLength - 1)
  return current
}

// Shuffle mode 'random': a random index other than the current one. Needs at
// least two tracks. `random` is injectable so tests can make it deterministic.
export function randomOtherIndex(current, length, random = Math.random) {
  let next
  do { next = Math.floor(random() * length) } while (next === current)
  return next
}

// Shuffle mode 'reorder': the queue with the playing track moved to the front
// and everything else Fisher–Yates shuffled behind it.
export function shuffledAroundCurrent(queue, current, random = Math.random) {
  const rest = queue.filter((_, n) => n !== current)
  for (let j = rest.length - 1; j > 0; j--) {
    const k = Math.floor(random() * (j + 1))
    ;[rest[j], rest[k]] = [rest[k], rest[j]]
  }
  return [queue[current], ...rest]
}
