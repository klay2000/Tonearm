const BASE_URL = 'http://10.0.0.10:4747/rest'
const AUTH = {
  u: 'aesthetic',
  p: 'ZZrDHzetZBtubU6xaCav',
  v: '1.16.0',
  c: 'aesthetic-client',
  f: 'json',
}

function authParams() {
  return new URLSearchParams(AUTH).toString()
}

async function request(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  Object.entries({ ...AUTH, ...params }).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  const root = data['subsonic-response']

  if (root.status === 'failed') {
    throw new Error(root.error?.message ?? 'Subsonic error')
  }

  return root
}

export async function ping() {
  return request('ping')
}

export async function getArtists() {
  const data = await request('getArtists')
  return data.artists?.index ?? []
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

export function streamUrl(id) {
  return `${BASE_URL}/stream?id=${id}&${authParams()}`
}

export function coverUrl(id, size = 256) {
  return `${BASE_URL}/getCoverArt?id=${id}&size=${size}&${authParams()}`
}
