// In the Tauri desktop app, Album Art Mode also shrinks the OS window down
// to a small, undecorated square (the cover art crops to fill it) and
// restores it on exit. No-op in the browser, where the overlay
// (AlbumArtMode.svelte) handles everything via CSS.
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// Must match the window's configured minWidth/minHeight in tauri.conf.json.
const NORMAL_MIN_SIZE = { width: 900, height: 600 }
const MINI_SIZE = { width: 320, height: 320 }

let savedSize = null

export async function enterAlbumArtWindow() {
  if (!isTauri || savedSize) return
  const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window')
  const win = getCurrentWindow()
  savedSize = await win.outerSize()
  await win.setDecorations(false)
  await win.setMinSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height))
  await win.setSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height))
}

export async function exitAlbumArtWindow() {
  if (!isTauri || !savedSize) return
  const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window')
  const win = getCurrentWindow()
  await win.setDecorations(true)
  await win.setMinSize(new LogicalSize(NORMAL_MIN_SIZE.width, NORMAL_MIN_SIZE.height))
  await win.setSize(savedSize)
  savedSize = null
}
