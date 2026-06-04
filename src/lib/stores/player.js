import { writable, derived, get } from 'svelte/store'

export const queue = writable([])
export const queueIndex = writable(-1)
export const playing = writable(false)
export const currentTime = writable(0)
export const duration = writable(0)
export const volume = writable(1)
export const shuffle = writable(false)
export const repeat = writable('off') // 'off' | 'all' | 'one'
// 'random': pick a random next track each time
// 'reorder': physically shuffle the queue when shuffle is toggled on
export const shuffleMode = writable(localStorage.getItem('subsonic_shuffle_mode') ?? 'random')
shuffleMode.subscribe(v => localStorage.setItem('subsonic_shuffle_mode', v))

export const currentTrack = derived(
  [queue, queueIndex],
  ([$queue, $queueIndex]) => $queue[$queueIndex] ?? null
)

export function toggleShuffle() {
  const next = !get(shuffle)
  shuffle.set(next)
  if (next && get(shuffleMode) === 'reorder') {
    const i = get(queueIndex)
    queue.update(q => {
      const current = q[i]
      const rest = q.filter((_, n) => n !== i)
      for (let j = rest.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[rest[j], rest[k]] = [rest[k], rest[j]]
      }
      return [current, ...rest]
    })
    queueIndex.set(0)
  }
}

export function cycleRepeat() {
  repeat.update(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')
}

export function playQueue(tracks, startIndex = 0) {
  queue.set(tracks)
  queueIndex.set(startIndex)
  playing.set(true)
}

export function playNext() {
  const i = get(queueIndex)
  const q = get(queue)
  const s = get(shuffle)
  const r = get(repeat)
  if (s && get(shuffleMode) === 'random' && q.length > 1) {
    let next
    do { next = Math.floor(Math.random() * q.length) } while (next === i)
    queueIndex.set(next)
  } else if (i < q.length - 1) {
    queueIndex.set(i + 1)
  } else if (r === 'all') {
    queueIndex.set(0)
  }
}

export function playPrev() {
  const i = get(queueIndex)
  if (get(currentTime) > 3) {
    currentTime.set(0)
  } else {
    queueIndex.set(Math.max(0, i - 1))
  }
}

export function togglePlay() {
  playing.update(p => !p)
}

// Insert tracks immediately after current position
export function insertNext(tracks) {
  const arr = Array.isArray(tracks) ? tracks : [tracks]
  const i = get(queueIndex)
  queue.update(q => [...q.slice(0, i + 1), ...arr, ...q.slice(i + 1)])
}

// Append tracks to end of queue
export function enqueue(tracks) {
  const arr = Array.isArray(tracks) ? tracks : [tracks]
  queue.update(q => [...q, ...arr])
}

// Move a track from one index to another (for queue reordering)
export function moveQueueItem(from, to) {
  queue.update(q => {
    const next = [...q]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
  })
  // Keep queueIndex pointing at the same track after the move
  const i = get(queueIndex)
  if (from === i) {
    queueIndex.set(to)
  } else if (from < i && to >= i) {
    queueIndex.set(i - 1)
  } else if (from > i && to <= i) {
    queueIndex.set(i + 1)
  }
}

export function removeFromQueue(index) {
  const i = get(queueIndex)
  queue.update(q => q.filter((_, n) => n !== index))
  if (index < i) queueIndex.set(i - 1)
  else if (index === i) queueIndex.set(Math.min(i, get(queue).length - 1))
}
