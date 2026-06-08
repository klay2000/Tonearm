// MusicBrainz blocks plain browser User-Agents, so requests can't go out directly
// from the webview. In the web app, nginx proxies /api/mb/ with a custom UA
// (see README "nginx" section). In the Tauri desktop app there's no proxy, so
// requests are routed through a Rust command that sets the UA itself.
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const RATE_LIMIT_MS = 1200

async function rawFetch(path) {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return JSON.parse(await invoke('mb_fetch', { path }))
  }
  const res = await fetch(`/api/mb/${path}`)
  return res.json()
}

// MusicBrainz allows ~1 request/sec, so all callers share a single queue.
let chain = Promise.resolve()

export function mbFetch(path) {
  const result = chain.then(async () => {
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
    return rawFetch(path)
  })
  chain = result.then(() => {}, () => {})
  return result
}
