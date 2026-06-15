// Pure helpers for merging duplicate/collaboration artist entries — kept
// free of browser globals so they can run under plain Node in tests. The
// related localStorage-backed settings stores live in artistMerge.js.

// Separators that join multiple artist names into one combined "artist"
// entry, e.g. "Artist One & Artist Two" or "Artist One feat. Artist Two".
// Kept conservative: only matches separators that are very unlikely to
// appear inside a single band/artist name. Things like "Earth, Wind & Fire",
// "Crosby, Stills & Nash" or "Above & Beyond" would also be split here —
// that's an accepted trade-off for this issue's scope (see notes in
// artistMergeLogic.test.js).
const SEPARATOR_RE = /\s*(?:&|,|\bfeat\.|\bfeat\b|\bft\.|\bft\b|\bvs\.|\bvs\b|\bwith\b)\s*/i

/**
 * If `name` looks like a combination of multiple artist names (joined by
 * "&", "feat.", "ft.", "vs.", "with", or commas), return the individual
 * component names in order. Otherwise return null.
 *
 * Conservative by design: requires at least one of the known separator
 * tokens to actually be present, so plain band names with no separator
 * (e.g. "AC/DC") are left alone.
 */
export function parseCombinationArtist(name) {
  if (!name) return null
  if (!SEPARATOR_RE.test(name)) return null

  const parts = name
    .split(SEPARATOR_RE)
    .map(p => p.trim())
    .filter(Boolean)

  if (parts.length < 2) return null
  return parts
}

/**
 * Given the full artist index (as returned by getArtists(), an array of
 * { name, artist: [...] } groups) and a target artist name, find every
 * "combination" artist entry whose parsed components include the target
 * (case-insensitive), excluding the target's own entry.
 *
 * Returns an array of { id, name, components }.
 */
export function findCombinationEntries(indices, artistName) {
  const target = artistName.trim().toLowerCase()
  const matches = []

  for (const idx of indices ?? []) {
    for (const artist of idx.artist ?? []) {
      if (artist.name.trim().toLowerCase() === target) continue
      const components = parseCombinationArtist(artist.name)
      if (!components) continue
      if (components.some(c => c.toLowerCase() === target)) {
        matches.push({ id: artist.id, name: artist.name, components })
      }
    }
  }

  return matches
}

/**
 * Pick a canonical display casing among a list of name variants that are
 * equal case-insensitively. Prefers the most frequently occurring casing;
 * ties broken by: more uppercase letters first (favors stylized casing
 * like "AC/DC" over "ac/dc"), then alphabetically.
 */
export function pickCanonicalCasing(names) {
  const counts = new Map()
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  const upperCount = s => (s.match(/[A-Z]/g) ?? []).length

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1] // higher count first
      const upperDiff = upperCount(b[0]) - upperCount(a[0])
      if (upperDiff !== 0) return upperDiff
      return a[0].localeCompare(b[0])
    })[0][0]
}

/**
 * Merge artist entries that are case-insensitive duplicates of each other
 * across the whole index (e.g. "AC/DC" in the A section and "Ac/Dc" in
 * another), into a single entry with a canonical display name. The merged
 * entry's albumCount is the sum of all duplicates' counts, and it carries a
 * `mergedIds` array listing every source entry's id so the artist page can
 * fetch and combine albums from each underlying entry.
 *
 * Input/output shape matches getArtists(): an array of
 * { name: <letter>, artist: [{ id, name, albumCount, ... }] }.
 * Re-buckets merged entries by the first letter of their canonical name,
 * preserving the original letter ordering and appending new letter groups
 * only if needed.
 */
export function mergeCaseDuplicateArtists(indices) {
  // Collect every artist entry across all letter groups.
  const all = []
  for (const idx of indices ?? []) {
    for (const artist of idx.artist ?? []) {
      all.push(artist)
    }
  }

  // Group by lowercased name.
  const groups = new Map()
  for (const artist of all) {
    const key = artist.name.trim().toLowerCase()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(artist)
  }

  // Build merged entries.
  const merged = []
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0])
      continue
    }
    const canonicalName = pickCanonicalCasing(group.map(a => a.name))
    const canonical = group.find(a => a.name === canonicalName) ?? group[0]
    merged.push({
      ...canonical,
      name: canonicalName,
      albumCount: group.reduce((sum, a) => sum + (a.albumCount ?? 0), 0),
      mergedIds: group.map(a => a.id),
    })
  }

  // Re-bucket by first letter, preserving the original letter group order
  // where possible.
  const lettersInOrder = (indices ?? []).map(idx => idx.name)
  const buckets = new Map()
  for (const artist of merged) {
    const letter = bucketLetter(artist.name, lettersInOrder)
    if (!buckets.has(letter)) buckets.set(letter, [])
    buckets.get(letter).push(artist)
  }

  const orderedLetters = lettersInOrder.filter(l => buckets.has(l))
  for (const letter of buckets.keys()) {
    if (!orderedLetters.includes(letter)) orderedLetters.push(letter)
  }

  return orderedLetters.map(letter => ({
    name: letter,
    artist: buckets.get(letter).sort((a, b) => a.name.localeCompare(b.name)),
  }))
}

/**
 * Combine album arrays from multiple artist entries (the primary artist
 * plus any case-duplicate / collaboration entries) into one list, with
 * albums that appear in more than one source (by id) de-duplicated.
 */
export function combineAlbumLists(...albumLists) {
  const seen = new Set()
  const combined = []
  for (const albums of albumLists) {
    for (const album of albums ?? []) {
      if (seen.has(album.id)) continue
      seen.add(album.id)
      combined.push(album)
    }
  }
  return combined
}

// Find which existing index letter an artist's name belongs under, falling
// back to its uppercased first character if none of the existing letters
// match (mirrors how Subsonic servers typically bucket non-letter/number
// names under '#').
function bucketLetter(name, knownLetters) {
  const first = name.trim()[0]?.toUpperCase() ?? '#'
  if (knownLetters.includes(first)) return first
  if (/[A-Z]/.test(first)) return first
  return knownLetters.includes('#') ? '#' : first
}
