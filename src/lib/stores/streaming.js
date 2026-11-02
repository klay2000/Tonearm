import { persisted } from './persisted.js'

// Max bitrate (kbps) to request via the Subsonic `stream` endpoint.
// 0 = original quality, no server-side transcoding.
export const transcodeBitrate = persisted('subsonic_transcode_bitrate', 0)
