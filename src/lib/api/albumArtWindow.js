// In the Tauri desktop app, Album Art Mode also shrinks the OS window down
// to a small, undecorated square (the cover art crops to fill it) and
// restores it on exit. No-op in the browser, where the overlay
// (AlbumArtMode.svelte) handles everything via CSS.
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// Must match the window's configured minWidth/minHeight in tauri.conf.json.
const NORMAL_MIN_SIZE = { width: 900, height: 600 }
const MINI_SIZE = { width: 320, height: 320 }
const MINI_MIN_SIZE = { width: 220, height: 220 }
const MINI_MAX_SIZE = { width: 800, height: 800 }

let savedSize = null

export async function enterAlbumArtWindow() {
  if (!isTauri || savedSize) return
  const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window')
  const win = getCurrentWindow()
  savedSize = await win.outerSize()

  await win.setDecorations(false)
  // Removing decorations changes the window's outer size on some Linux
  // window managers, but the compositor doesn't always apply that change
  // before the next call resolves. Drop the min size first so setSize()
  // below isn't clamped against the (larger) normal minimum, then re-apply
  // the size on the next frame to land on an exact square.
  await win.setMinSize(new LogicalSize(MINI_MIN_SIZE.width, MINI_MIN_SIZE.height))
  await win.setMaxSize(new LogicalSize(MINI_MAX_SIZE.width, MINI_MAX_SIZE.height))
  await win.setSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height))

  // Re-apply once more after the decoration change has settled, so the
  // window reliably ends up exactly MINI_SIZE x MINI_SIZE regardless of
  // WM quirks or DPI scale-factor rounding.
  await new Promise((resolve) => requestAnimationFrame(resolve))
  await win.setSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height))
}

export async function exitAlbumArtWindow() {
  if (!isTauri || !savedSize) return
  const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window')
  const win = getCurrentWindow()
  await win.setDecorations(true)
  await win.setMinSize(new LogicalSize(NORMAL_MIN_SIZE.width, NORMAL_MIN_SIZE.height))
  await win.setMaxSize(null)
  await win.setSize(savedSize)
  savedSize = null
}

// Starts an OS-driven resize drag in the given direction from a
// data-tauri-resize-handle element's pointerdown handler. Required for
// undecorated windows (Tauri v2 doesn't draw resize borders for them).
// No-op outside Tauri.
export async function startResizeDrag(e, direction) {
  if (!isTauri) return
  e.preventDefault()
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().startResizeDragging(direction)
}
