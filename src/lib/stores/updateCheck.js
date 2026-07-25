// Pure helpers for the auto-updater: version comparison and picking the
// right AppImage asset from a GitHub release. No DOM/Tauri access here so it
// can be unit-tested under plain Node.

// Split a version like "1.2.3" (or "v1.2.3") into numeric parts.
function parts(v) {
  return String(v).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0)
}

// -1 if a < b, 1 if a > b, 0 if equal (compared part by part).
export function compareVersions(a, b) {
  const pa = parts(a)
  const pb = parts(b)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x < y) return -1
    if (x > y) return 1
  }
  return 0
}

export function isNewer(latest, current) {
  return compareVersions(latest, current) > 0
}

// Tokens that identify an AppImage built for a given CPU arch. `arch` comes
// from Rust's std::env::consts::ARCH ("x86_64", "aarch64", ...).
const ARCH_TOKENS = {
  x86_64: ['x86_64', 'amd64', 'x64'],
  aarch64: ['aarch64', 'arm64'],
}

// Pick the .AppImage asset matching the running CPU arch, or null if the
// release has no build for it.
export function pickAppImageAsset(assets, arch) {
  const tokens = ARCH_TOKENS[arch] ?? [arch]
  const appimages = (assets ?? []).filter(a => /\.appimage$/i.test(a.name || ''))
  const match = appimages.find(a => {
    const name = a.name.toLowerCase()
    return tokens.some(t => name.includes(t))
  })
  // If nothing is arch-tagged but there's exactly one AppImage, assume it's
  // the right one (keeps single-arch releases working).
  if (!match && appimages.length === 1 && !appimages[0].name.match(/x86_64|amd64|aarch64|arm64/i)) {
    return appimages[0]
  }
  return match ?? null
}

// Given the GitHub "latest release" JSON, the current app version, and the
// running arch, decide whether an update is available and where to get it.
export function evaluateRelease(release, currentVersion, arch) {
  if (!release || !release.tag_name) return { available: false }
  const version = String(release.tag_name).replace(/^v/, '')
  if (!isNewer(version, currentVersion)) return { available: false, version }
  const asset = pickAppImageAsset(release.assets, arch)
  if (!asset) return { available: false, version, noBuildForArch: true }
  return {
    available: true,
    version,
    url: asset.browser_download_url,
    name: asset.name,
  }
}
