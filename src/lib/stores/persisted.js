import { writable } from 'svelte/store'
import { codecFor, readPersisted } from './persistedLogic.js'

// A writable store backed by localStorage: it starts from the saved value (or
// `fallback` if there isn't one) and writes every change back under `key`.
// The codec is chosen from the type of `fallback`; pass `{ parse, serialize }`
// for anything that needs more than that (clamping, merging with defaults…).
export function persisted(key, fallback, codec = codecFor(fallback)) {
  const store = writable(readPersisted(localStorage.getItem(key), fallback, codec))
  store.subscribe(v => localStorage.setItem(key, codec.serialize(v)))
  return store
}
