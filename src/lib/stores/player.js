import { writable, derived, get } from 'svelte/store'
import { auth } from './auth.js'
import { linearNextIndex, prevIndex, indexAfterMove, indexAfterRemove } from './queueLogic.js'

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
  } else {
    queueIndex.set(linearNextIndex(i, q.length, r))
  }
}

export function playPrev() {
  const i = get(queueIndex)
  if (get(currentTime) > 5) {
    currentTime.set(0)
  } else {
    queueIndex.set(prevIndex(i))
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
  queueIndex.set(indexAfterMove(i, from, to))
}

export function removeFromQueue(index) {
  const i = get(queueIndex)
  queue.update(q => q.filter((_, n) => n !== index))
  queueIndex.set(indexAfterRemove(i, index, get(queue).length))
}

export function clearQueue() {
  const i = get(queueIndex)
  const q = get(queue)
  if (i >= 0 && q[i]) {
    queue.set([q[i]])
    queueIndex.set(0)
  } else {
    queue.set([])
    queueIndex.set(-1)
  }
}

// Session persistence — saved per account, restored on login
function playerKey(username) {
  return `tonearm_${username}_player`
}

function savePlayerState() {
  const a = get(auth)
  if (!a?.username) return
  try {
    localStorage.setItem(playerKey(a.username), JSON.stringify({
      queue: get(queue),
      queueIndex: get(queueIndex),
      volume: get(volume),
      shuffle: get(shuffle),
      repeat: get(repeat),
    }))
  } catch {}
}

let _saveTimer = null
function scheduleSave() {
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(savePlayerState, 500)
}

auth.subscribe($auth => {
  if (!$auth?.username) return
  try {
    const raw = localStorage.getItem(playerKey($auth.username))
    if (!raw) return
    const s = JSON.parse(raw)
    if (Array.isArray(s.queue) && s.queue.length) queue.set(s.queue)
    if (typeof s.queueIndex === 'number') queueIndex.set(s.queueIndex)
    if (typeof s.volume === 'number') volume.set(s.volume)
    if (typeof s.shuffle === 'boolean') shuffle.set(s.shuffle)
    if (s.repeat === 'off' || s.repeat === 'all' || s.repeat === 'one') repeat.set(s.repeat)
  } catch {}
})

queue.subscribe(scheduleSave)
queueIndex.subscribe(scheduleSave)
volume.subscribe(scheduleSave)
shuffle.subscribe(scheduleSave)
repeat.subscribe(scheduleSave)
