// Pure ReplayGain math — kept free of Web Audio/browser globals so it can be
// unit-tested directly. PlayerBar.svelte feeds the result into a GainNode.

// Computes the linear gain multiplier to apply to a track's output so it
// matches a common reference loudness, per the OpenSubsonic "replayGain"
// extension (https://opensubsonic.netlify.app/docs/extensions/replaygain/).
//
// `track.replayGain` may contain trackGain/albumGain (dB), trackPeak/albumPeak
// (linear amplitude 0-1), baseGain (dB, default 0) and fallbackGain (dB).
// Returns 1 (no change) if the track has no usable gain data.
export function computeReplayGain(track, { preferAlbum = false } = {}) {
  const rg = track?.replayGain
  if (!rg) return 1

  const primary = preferAlbum ? 'album' : 'track'
  const secondary = preferAlbum ? 'track' : 'album'

  let gainDb = rg[`${primary}Gain`]
  let peak = rg[`${primary}Peak`]
  if (gainDb === undefined) {
    gainDb = rg[`${secondary}Gain`]
    peak = rg[`${secondary}Peak`]
  }
  if (gainDb === undefined) gainDb = rg.fallbackGain
  if (gainDb === undefined) return 1

  const totalDb = gainDb + (rg.baseGain ?? 0)
  let gain = 10 ** (totalDb / 20)

  // Prevent clipping: scale down so peak * gain never exceeds full scale.
  if (peak > 0) gain = Math.min(gain, 1 / peak)

  return gain
}
