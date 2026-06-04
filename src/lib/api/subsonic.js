import { get } from 'svelte/store'
import { auth } from '../stores/auth.js'

const API_META = { v: '1.16.0', c: 'tonearm', f: 'json' }

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
  const root = data['subsonic-response']
  if (root.status === 'failed') throw new Error(root.error?.message ?? 'Subsonic error')
  return root
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
  return buildUrl('stream', { id }).toString()
}

export function coverUrl(id, size = 256) {
  return buildUrl('getCoverArt', { id, size }).toString()
}
