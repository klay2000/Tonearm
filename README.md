<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.svg">
  <img alt="Tonearm" src="public/logo.svg" height="48">
</picture>

A minimal, modern, self-hosted music client for [Gonic](https://github.com/sentriz/gonic) / Subsonic servers.

## Features

- Browse artists, albums, and tracks
- Search across your library
- Streaming playback with queue, seek, and volume control
- Mute toggle with dynamic volume icon
- Shuffle (random-next or reorder-queue) and repeat (off / all / one)
- Play or shuffle an entire artist's discography in one click
- Queue management: reorder by drag, remove tracks, clear queue, play next
- Album art scraping from TheAudioDB and Cover Art Archive when server has none
- Artist avatars sourced from TheAudioDB and Wikimedia
- Auto dark/light theme by user-configured start times, switching live while open (or set manually)
- Touch-friendly mode that drops hover effects for touchscreens
- Player state (queue, volume, shuffle, repeat) persisted across sessions
- Volume normalization: attenuates loud tracks using ReplayGain tags from your library (optional)
- Settings screen: theme preference, shuffle mode, volume normalization, build info
- Keyboard shortcuts: `Space` play/pause · `→` next · `←` prev · `m` mute

## Stack

- [Svelte 5](https://svelte.dev/) + [Vite 5](https://vitejs.dev/)
- No UI framework, no component library — plain CSS with custom properties
- Subsonic REST API (JSON mode)
- [Tauri v2](https://tauri.app/) — optional desktop wrapper, builds as a Linux AppImage

## Dev

```bash
npm install
npm run dev       # dev server at http://localhost:5173
```

## Build & deploy

```bash
npm run build     # outputs dist/
```

Serve `dist/` as static files. The app talks directly to your Gonic server from the browser — no backend needed.

## Docker

A `Dockerfile` and `nginx.conf` are included for hosting the built app behind nginx, MusicBrainz proxy and all (see [nginx](#nginx) below):

```bash
docker build -t tonearm .
docker run -d -p 8080:80 tonearm   # → http://localhost:8080
```

## Testing

```bash
npm test          # runs src/**/*.test.js with Node's built-in test runner
```

Tests cover pure logic only (sun-times math, queue-index arithmetic, hash-route parsing — see `src/lib/stores/*.test.js`); Svelte components and browser-dependent store glue aren't unit-tested.

## CI/CD

GitHub Actions (`.github/workflows/`):

- **`ci.yml`** — on every push/PR to `main`: install, `npm run build`, `npm test`.
- **`release.yml`** — on pushing a version tag like `1.2.3`: builds the web bundle and the Tauri AppImage, then publishes both as a GitHub release named after the tag.

To cut a release: tag a commit on `main` with a plain `x.y.z` version (e.g. `git tag 1.2.0 && git push origin 1.2.0`). A tag with a pre-release suffix (e.g. `1.3.0-beta`) also triggers a build and is published as a GitHub pre-release.

## Desktop app (Tauri)

The `src-tauri/` directory wraps the web app as a native Linux desktop app ("Tonearm") using Tauri v2, bundled as an AppImage.

Requires a Rust toolchain (1.86+) and the GTK/WebKit system libraries:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev \
  libayatana-appindicator3-dev libxdo-dev build-essential libssl-dev
```

```bash
npm run tauri dev      # launch in development (hot reload)
npm run tauri build    # build the AppImage
```

`src-tauri/src/main.rs` forces WebKit software rendering (`WEBKIT_DISABLE_COMPOSITING_MODE`, `WEBKIT_DISABLE_DMABUF_RENDERER`, `LIBGL_ALWAYS_SOFTWARE`) and the local GIO VFS (`GIO_USE_VFS=local`) before the webview starts. This fixes two host-dependent failure modes baked into WebKitGTK/AppImage:

- **Blank window** (`GBM`/`DRM_IOCTL_MODE_CREATE_DUMB ... Permission denied` in the log) — happens on VMs and other virtual/remote displays without a working DRM/KMS GPU path.
- **`undefined symbol: g_variant_builder_init_static` / "Failed to load module … libgvfsdbus.so"** — the AppImage's bundled GLib can mismatch the host's `gvfs` GIO modules; Tonearm doesn't need gvfs (trash, network mounts, …), so it's skipped.

### Running the AppImage

WebKitGTK plays `<audio>` through GStreamer, which the AppImage does **not** bundle — install the host's plugins or playback will silently fail (look for `GStreamer element appsink/autoaudiosink not found` in the log):

```bash
sudo apt-get install -y gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
  gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav
```

### nginx

`nginx.conf` (also used by the Docker image above) proxies MusicBrainz, required to work around their browser User-Agent restriction:

```nginx
server {
    listen 80 default_server;
    root /path/to/subsonic-client/dist;
    index index.html;

    location /api/mb/ {
        proxy_pass https://musicbrainz.org/ws/2/;
        proxy_set_header Host musicbrainz.org;
        proxy_set_header User-Agent "tonearm/0.1 (local)";
        proxy_ssl_server_name on;
        resolver 1.1.1.1;
    }

    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}
```
