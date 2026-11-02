// Pure helpers for persisted() — kept free of localStorage and Svelte so they
// can be unit-tested directly. persisted.js wires them to a writable store.

// How to turn a stored string back into a value, and a value into a string.
// Picked from the type of the default unless the caller supplies its own.
export function codecFor(fallback) {
  if (typeof fallback === 'boolean') {
    return {
      // Anything other than the opposite of the default reads as the default,
      // so a corrupt entry can't flip a setting.
      parse: raw => (fallback ? raw !== 'false' : raw === 'true'),
      serialize: String,
    }
  }
  if (typeof fallback === 'number') {
    return { parse: Number, serialize: String }
  }
  if (typeof fallback === 'string') {
    return { parse: raw => raw, serialize: v => v }
  }
  return { parse: raw => JSON.parse(raw), serialize: v => JSON.stringify(v) }
}

// The value a persisted store should start with, given what's in storage
// (`raw` is null when the key has never been written).
export function readPersisted(raw, fallback, codec = codecFor(fallback)) {
  if (raw === null || raw === undefined) return fallback
  try {
    return codec.parse(raw)
  } catch {
    return fallback
  }
}
