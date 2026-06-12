import { writable } from 'svelte/store'

const KEY = 'subsonic_view_modes'

// 'shelf' | 'list', independently per view
const defaults = {
  home: 'shelf',
  artist: 'shelf',
  search: 'list',
  artists: 'list',
}

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return { ...defaults }
  }
}

export const viewModes = writable(load())
viewModes.subscribe(v => localStorage.setItem(KEY, JSON.stringify(v)))

export function setViewMode(view, mode) {
  viewModes.update(v => ({ ...v, [view]: mode }))
}
