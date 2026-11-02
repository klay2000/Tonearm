import { get } from 'svelte/store'
import { auth, expireSession } from '../stores/auth.js'
import { transcodeBitrate } from '../stores/streaming.js'
import { parseSubsonicResponse, AuthError } from './subsonicLogic.js'

// 1.16.1 is the minimum version that includes the ReplayGain fields on
// song entries (used for volume normalization).
const API_META = { v: '1.16.1', c: 'tonearm', f: 'json' }

function credentials() {
  const a = get(auth)
  if (!a) throw new Error('Not authenticated')
  return a
}

function buildUrl(endpoint, extra = {}) {
  const { serverUrl, username, password } = credentials()
  const url = new URL(`${serverUrl}/rest/${endpoint}`)
  Object.entries({ u: username, p: password, ...API_META, ...extra })
    .forEach(([k, v]) => url.searchParams.set(k, v))
  return url
}

async function request(endpoint, params = {}) {
  const url = buildUrl(endpoint, params)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  try {
    return parseSubsonicResponse(data['subsonic-response'])
  } catch (err) {
    // A stale password leaves every request failing. Log out so the app
    // falls back to the login screen instead of every view erroring out.
    if (err instanceof AuthError) expireSession()
    throw err
  }
}

export async function testConnection(serverUrl, username, password) {
  const url = new URL(`${serverUrl.replace(/\/$/, '')}/rest/ping`)
  Object.entries({ u: username, p: password, ...API_META })
    .forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const root = data['subsonic-response']
  if (root.status === 'failed') throw new Error(root.error?.message ?? 'Subsonic error')
  return root
}

export async function ping() {
  return request('ping')
}

export async function getArtists() {
  const data = await request('getArtists')
  return data.artists?.index ?? []
}

// The full artist index rarely changes within a session and is needed by
// both the A-Z artist list and (for collab-album/casing merging) the single
// artist page. Cache it in memory so visiting an artist page doesn't trigger
// a second full-index fetch.
let artistsCache = null

export async function getArtistsCached() {
  if (!artistsCache) artistsCache = getArtists()
  try {
    return await artistsCache
  } catch (err) {
    artistsCache = null // allow retry on next call
    throw err
  }
}

export async function getArtist(id) {
  const data = await request('getArtist', { id })
  return data.artist
}

export async function getAlbum(id) {
  const data = await request('getAlbum', { id })
  return data.album
}

export async function getArtistInfo(id) {
  const data = await request('getArtistInfo2', { id })
  return data.artistInfo2 ?? {}
}

export async function getAlbumList(type, size = 16) {
  const data = await request('getAlbumList2', { type, size })
  return data.albumList2?.album ?? []
}

export async function search(query) {
  const data = await request('search3', { query, artistCount: 5, albumCount: 8, songCount: 20 })
  return data.searchResult3 ?? {}
}

export async function getAllAlbums() {
  const albums = []
  let offset = 0
  while (true) {
    const data = await request('getAlbumList2', { type: 'alphabeticalByName', size: 500, offset })
    const page = data.albumList2?.album ?? []
    albums.push(...page)
    if (page.length < 500) break
    offset += 500
  }
  return albums
}

export async function getRandomSongs(size = 500) {
  const data = await request('getRandomSongs', { size })
  return data.randomSongs?.song ?? []
}

// Reports playback progress to the server so it can forward scrobbles to
// Last.fm/ListenBrainz (configured server-side in Gonic). Best-effort —
// failures must never interrupt playback.
export async function scrobble(id, { submission, time } = {}) {
  try {
    const params = { id }
    if (submission !== undefined) params.submission = submission
    if (time !== undefined) params.time = time
    await request('scrobble', params)
  } catch {
    // ignore — scrobbling is best-effort
  }
}

// `timeOffset` (seconds) asks the server to start the stream partway into the
// track. It's how seeking works on a transcoded stream, which is delivered
// chunked and can't be seeked client-side.
export function streamUrl(id, timeOffset = 0) {
  const bitrate = get(transcodeBitrate)
  // "Original" asks for format=raw explicitly. Without it the server applies
  // its own transcode profile and sends the result chunked, with no
  // Content-Length or Accept-Ranges — which makes the stream unseekable, so
  // scrubbing can't work and every network hiccup reaches the decoder.
  const params = bitrate > 0 ? { id, maxBitRate: bitrate, format: 'mp3' } : { id, format: 'raw' }
  if (timeOffset > 0) params.timeOffset = Math.floor(timeOffset)
  return buildUrl('stream', params).toString()
}

export function coverUrl(id, size = 256) {
  return buildUrl('getCoverArt', { id, size }).toString()
}
