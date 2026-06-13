# Album Art Mode — focus-ring artifact debug notes (issue #56)

Temporary status doc for the in-progress visual bug on the `issue-56` branch
(album art mode feature). Delete this file once the bug is confirmed fixed.

## The bug

When entering Album Art Mode in the **Tauri desktop app** (browser is
unaffected), a small white rectangle with slightly rounded corners —
"almost a focus ring" — briefly appears near the bottom-right of center of
the art, then fades away.

Confirmed details:
- Tauri desktop only, not the browser.
- Happens with "Album art mode player bar" setting OFF (art fills the whole
  window).
- Only on **entering** album art mode — not on exit, not on track changes,
  not when the controls overlay is shown/hidden.
- Present in production AppImage builds, not just dev/HMR.
- Not caused (solely) by `setDecorations(false)` — removing it didn't fix it.

## Attempts tried and reverted (did not fix it)

1. Reorder `setDecorations`/resize calls in `albumArtWindow.js`.
2. CSS `:hover` overlay flash gate (`hoverReady`) in `AlbumArtMode.svelte`.
3. Wrap `hide()`/`show()` around the decoration/resize change.
4. Remove `setDecorations(false)` on enter only.
5. Delay mounting `<AlbumArtMode>` until after resize resolves
   (`albumArtReady` gating in `App.svelte`).
6. Double `requestAnimationFrame` delay before `enterAlbumArtWindow()` in
   `App.svelte`.

All of the above were reverted back to the original PR baseline.

## Current attempt (untested as of writing)

**Theory:** the "Album art mode" toggle button in the player bar
(`.queue-btn` in `PlayerBar.svelte`, `border-radius: 4px`) has no
`outline: none`. Clicking it gives it browser focus, and WebKitGTK likely
draws its default focus ring there — a small, slightly-rounded white
rectangle — at the bottom-right of the player bar / window. This would
explain why it only happens on the click that *opens* the mode (not on
Escape-to-close, track changes, or controls toggling).

**Change made:** added `outline: none;` to `.queue-btn` in
`src/lib/components/PlayerBar.svelte`.

`npm run build` passes. Awaiting user test in the running dev app to confirm
whether the artifact is gone.

## If this doesn't fix it

Next steps to consider:
- Get a screen recording of the artifact (static description hasn't
  converged after several attempts).
- Check other focusable elements near the bottom-right of the window that
  might receive focus on the click that opens album art mode.
- Consider whether GTK CSD (titlebar button widgets) remain allocated even
  with `decorations: false`, since "small white rectangle, slightly
  radiused corners, focus-ring-like" strongly resembles an Adwaita focus
  indicator.

## Outstanding diff (uncommitted, original PR work + current attempt)

- `src-tauri/capabilities/default.json`
- `src/lib/api/albumArtWindow.js`
- `src/lib/components/AlbumArtMode.svelte`
- `src/lib/components/PlayerBar.svelte` (new: `outline: none` on `.queue-btn`)
- `src/routes/Settings.svelte`
