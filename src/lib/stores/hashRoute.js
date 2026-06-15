// Pure parsing of a raw `location.hash` string into `{ path, params }` — kept
// free of `window` (mirroring themeSchedule.js) so it can run under plain Node in
// tests; router.js wires it up to the browser's hash-change events.
export function parseHash(hash) {
  const trimmed = hash.slice(1) || '/'
  const [path, ...rest] = trimmed.split('?')
  const params = Object.fromEntries(new URLSearchParams(rest.join('?')))
  return { path, params }
}
