import { writable, derived, get } from 'svelte/store'

export const queue = writable([])
export const queueIndex = writable(-1)
export const playing = writable(false)
export const currentTime = writable(0)
export const duration = writable(0)
export const volume = writable(1)

export const currentTrack = derived(
  [queue, queueIndex],
  ([$queue, $queueIndex]) => $queue[$queueIndex] ?? null
)

export function playQueue(tracks, startIndex = 0) {
  queue.set(tracks)
  queueIndex.set(startIndex)
  playing.set(true)
}

export function playNext() {
  const i = get(queueIndex)
  const q = get(queue)
  if (i < q.length - 1) queueIndex.set(i + 1)
}

export function playPrev() {
  const i = get(queueIndex)
  // If more than 3s in, restart track; otherwise go to previous
  if (get(currentTime) > 3) {
    currentTime.set(0)
  } else {
    queueIndex.set(Math.max(0, i - 1))
  }
}

export function togglePlay() {
  playing.update(p => !p)
}
