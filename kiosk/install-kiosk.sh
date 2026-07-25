#!/usr/bin/env bash
#
# Tonearm kiosk installer.
#
# Downloads the latest Tonearm AppImage for this machine's CPU architecture
# from GitHub Releases and installs a systemd *user* service that launches it
# at login. Intended for a device that auto-logs into a graphical desktop
# session (e.g. a Raspberry Pi running Raspberry Pi OS with desktop autologin).
#
# Usage:
#   ./install-kiosk.sh            # install / update to the latest release
#   ./install-kiosk.sh --uninstall
#
# No root required: everything is installed under the current user's home and
# runs as a systemd --user service.

set -euo pipefail

REPO="klay2000/Tonearm"
APP_DIR="${TONEARM_DIR:-$HOME/.local/share/tonearm}"
APPIMAGE_PATH="$APP_DIR/Tonearm.AppImage"
SERVICE_NAME="tonearm-kiosk.service"
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_PATH="$SERVICE_DIR/$SERVICE_NAME"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

uninstall() {
  log "Removing Tonearm kiosk service"
  systemctl --user disable --now "$SERVICE_NAME" 2>/dev/null || true
  rm -f "$SERVICE_PATH"
  systemctl --user daemon-reload 2>/dev/null || true
  rm -rf "$APP_DIR"
  log "Uninstalled. (Autologin/lingering settings, if any, were left untouched.)"
  exit 0
}

[ "${1:-}" = "--uninstall" ] && uninstall

command -v curl >/dev/null || die "curl is required"
command -v systemctl >/dev/null || die "systemctl is required (this expects a systemd system)"

# Map the machine architecture to the tokens Tauri uses in AppImage filenames.
arch="$(uname -m)"
case "$arch" in
  x86_64|amd64)   tokens="amd64 x86_64" ;;
  aarch64|arm64)  tokens="aarch64 arm64" ;;
  *) die "unsupported architecture: $arch" ;;
esac

log "Finding the latest Tonearm release for $arch"
api_json="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest")" \
  || die "could not reach the GitHub releases API"

# Collect every AppImage download URL in the release (no jq dependency).
mapfile -t appimages < <(printf '%s\n' "$api_json" \
  | grep -oE '"browser_download_url":[[:space:]]*"[^"]*\.AppImage"' \
  | sed -E 's/.*"(https[^"]+)".*/\1/')

[ "${#appimages[@]}" -gt 0 ] || die "the latest release has no .AppImage assets"

# Prefer an asset tagged with this arch; fall back to a lone untagged one.
url=""
for candidate in "${appimages[@]}"; do
  lower="$(printf '%s' "$candidate" | tr '[:upper:]' '[:lower:]')"
  for t in $tokens; do
    if printf '%s' "$lower" | grep -q "$t"; then url="$candidate"; break 2; fi
  done
done
if [ -z "$url" ] && [ "${#appimages[@]}" -eq 1 ]; then
  case "$(printf '%s' "${appimages[0]}" | tr '[:upper:]' '[:lower:]')" in
    *x86_64*|*amd64*|*aarch64*|*arm64*) : ;;
    *) url="${appimages[0]}" ;;
  esac
fi
[ -n "$url" ] || die "no AppImage in the latest release matches this device's architecture ($arch)"

log "Downloading $(basename "$url")"
mkdir -p "$APP_DIR"
tmp="$APP_DIR/.download.AppImage"
curl -fSL --progress-bar "$url" -o "$tmp" || die "download failed"
chmod +x "$tmp"
mv -f "$tmp" "$APPIMAGE_PATH"
log "Installed to $APPIMAGE_PATH"

log "Writing systemd user service"
mkdir -p "$SERVICE_DIR"
cat > "$SERVICE_PATH" <<EOF
[Unit]
Description=Tonearm kiosk
# Start once the graphical session is up so the app has a display to draw on.
After=graphical-session.target
PartOf=graphical-session.target

[Service]
Type=simple
ExecStart=$APPIMAGE_PATH
Restart=on-failure
RestartSec=3

[Install]
WantedBy=graphical-session.target
EOF

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
log "Service enabled. It will start Tonearm on your next graphical login."

cat <<'NOTE'

Next steps:
  * Make sure this device auto-logs into its desktop session. On Raspberry Pi
    OS: `sudo raspi-config` -> System Options -> Boot / Auto Login ->
    "Desktop Autologin".
  * To start it now without rebooting:
        systemctl --user start tonearm-kiosk.service
  * For fullscreen, open Tonearm -> Settings -> Kiosk -> Fullscreen: On
    (persists across restarts).
  * Logs:    journalctl --user -u tonearm-kiosk.service -f
  * Update:  re-run this script.  Remove:  ./install-kiosk.sh --uninstall
NOTE
