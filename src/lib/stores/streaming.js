import { writable } from 'svelte/store'

// Max bitrate (kbps) to request via the Subsonic `stream` endpoint.
// 0 = original quality, no server-side transcoding.
export const transcodeBitrate = writable(Number(localStorage.getItem('subsonic_transcode_bitrate') ?? 0))
transcodeBitrate.subscribe(v => localStorage.setItem('subsonic_transcode_bitrate', String(v)))
