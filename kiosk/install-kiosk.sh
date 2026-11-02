#!/usr/bin/env bash
#
# Tonearm kiosk installer.
#
# Downloads the latest Tonearm AppImage for this machine's CPU architecture
# from GitHub Releases and installs a systemd *user* service that launches it
# at graphical login. Intended for a device that auto-logs into a desktop
# session (e.g. a Raspberry Pi running Raspberry Pi OS with desktop autologin).
#
# Usage:
#   ./install-kiosk.sh                  # install / update to the latest release
#   ./install-kiosk.sh --appimage PATH  # install a local AppImage (offline/testing)
#   ./install-kiosk.sh --fix-wifi       # also turn off wifi power save (needs sudo)
#   ./install-kiosk.sh --uninstall
#
# No root required: everything is installed under the current user's home and
# runs as a systemd --user service. The one exception is --fix-wifi, which
# writes a NetworkManager drop-in and so asks for sudo.

set -euo pipefail

REPO="klay2000/Tonearm"
APP_DIR="${TONEARM_DIR:-$HOME/.local/share/tonearm}"
APPIMAGE_PATH="$APP_DIR/Tonearm.AppImage"
SERVICE_NAME="tonearm-kiosk.service"
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_PATH="$SERVICE_DIR/$SERVICE_NAME"

local_appimage=""
fix_wifi=0
NM_CONF="/etc/NetworkManager/conf.d/wifi-powersave-off.conf"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

uninstall() {
  log "Removing Tonearm kiosk service"
  systemctl --user disable --now "$SERVICE_NAME" 2>/dev/null || true
  rm -f "$SERVICE_PATH"
  systemctl --user daemon-reload 2>/dev/null || true
  rm -rf "$APP_DIR"
  log "Uninstalled. (Autologin settings, if any, were left untouched.)"
  exit 0
}

# Wifi power save parks the radio between beacons. The latency spikes that
# causes starve the audio buffer, which comes out of the speakers as crackle —
# so a kiosk streaming over wifi wants it off.
wifi_powersave_on() {
  command -v iw >/dev/null || return 1
  for dev in /sys/class/net/*/wireless; do
    [ -e "$dev" ] || continue
    name="$(basename "$(dirname "$dev")")"
    # `iw get power_save` prints nothing unprivileged, so fall back to a
    # passwordless sudo if one is available. If neither answers we just skip
    # the warning rather than nagging.
    state="$(iw dev "$name" get power_save 2>/dev/null)"
    [ -n "$state" ] || state="$(sudo -n iw dev "$name" get power_save 2>/dev/null || true)"
    printf '%s' "$state" | grep -qi "power save: on" && return 0
  done
  return 1
}

disable_wifi_powersave() {
  log "Turning off wifi power save"
  sudo mkdir -p "$(dirname "$NM_CONF")"
  printf '[connection]\n# Wifi power save causes latency spikes that make kiosk audio crackle.\n# 2 = disable.\nwifi.powersave = 2\n' \
    | sudo tee "$NM_CONF" > /dev/null
  # Apply now too, so it takes effect without a reconnect.
  for dev in /sys/class/net/*/wireless; do
    [ -e "$dev" ] || continue
    sudo iw dev "$(basename "$(dirname "$dev")")" set power_save off 2>/dev/null || true
  done
  log "Wifi power save off (persisted in $NM_CONF)"
}

case "${1:-}" in
  --uninstall)  uninstall ;;
  --appimage)   local_appimage="${2:-}"; [ -n "$local_appimage" ] || die "--appimage needs a path" ;;
  --fix-wifi)   fix_wifi=1 ;;
  "") ;;
  *) die "unknown option: $1" ;;
esac

command -v systemctl >/dev/null || die "systemctl is required (this expects a systemd system)"

mkdir -p "$APP_DIR"

if [ -n "$local_appimage" ]; then
  # Install a local file instead of downloading (offline / testing).
  [ -f "$local_appimage" ] || die "no such file: $local_appimage"
  log "Installing local AppImage: $local_appimage"
  install -m 0755 "$local_appimage" "$APPIMAGE_PATH"
else
  command -v curl >/dev/null || die "curl is required"

  # Map the machine architecture to the tokens Tauri uses in AppImage names.
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
  tmp="$APP_DIR/.download.AppImage"
  curl -fSL --progress-bar "$url" -o "$tmp" || die "download failed"
  chmod +x "$tmp"
  mv -f "$tmp" "$APPIMAGE_PATH"
fi
log "Installed to $APPIMAGE_PATH"

log "Writing systemd user service"
mkdir -p "$SERVICE_DIR"
# We start on default.target (reached when the autologin session begins) and
# wait for the X server, rather than binding to graphical-session.target:
# lightdm-based desktops (Raspberry Pi OS, XFCE, ...) don't reliably activate
# graphical-session.target in the systemd --user instance, so a service bound
# to it would never start. DISPLAY/XAUTHORITY are set for the single kiosk
# seat, and APPIMAGE_EXTRACT_AND_RUN avoids needing FUSE.
cat > "$SERVICE_PATH" <<EOF
[Unit]
Description=Tonearm kiosk

[Service]
Type=simple
Environment=DISPLAY=:0
Environment=XAUTHORITY=%h/.Xauthority
Environment=APPIMAGE_EXTRACT_AND_RUN=1
# Wait (up to ~60s) for the X server to come up after autologin.
ExecStartPre=/bin/sh -c 'for i in \$(seq 1 60); do [ -S /tmp/.X11-unix/X0 ] && exit 0; sleep 1; done; exit 0'
ExecStart=$APPIMAGE_PATH
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
log "Service enabled. It will start Tonearm on the next graphical login."

if [ "$fix_wifi" -eq 1 ]; then
  disable_wifi_powersave
elif wifi_powersave_on; then
  warn "wifi power save is on, which can make playback crackle on this device."
  warn "Re-run with --fix-wifi to turn it off, or do it by hand:"
  warn "    sudo iw dev wlan0 set power_save off   # now"
  warn "    echo -e '[connection]\\nwifi.powersave = 2' | sudo tee $NM_CONF   # persist"
fi

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
