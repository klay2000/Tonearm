// Applies the fullscreen preference to the actual window.
//
// - Tauri desktop app: uses the OS window's native fullscreen, which can be
//   set at any time (including on launch).
// - Browser: uses the Fullscreen API. Entering fullscreen requires transient
//   user activation, so this must run in the same task as the click that
//   toggled the setting; a reload can't silently re-enter it. Exiting is
//   always allowed. Errors (e.g. no user gesture) are swallowed.
import { isTauri } from './albumArtWindow.js'

export async function applyFullscreen(on) {
  if (isTauri) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().setFullscreen(on)
    return
  }
  try {
    if (on) {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    } else if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  } catch {
    // Browser blocked the request (typically: not triggered by a user
    // gesture). Nothing to do — the checkbox state is the source of truth.
  }
}
