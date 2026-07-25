# Tonearm kiosk mode

`install-kiosk.sh` turns a Linux device into a Tonearm kiosk: it downloads the
latest Tonearm AppImage for the device's CPU architecture and installs a
systemd **user** service that launches it at login.

It's published as an asset on each GitHub release, so on the target device you
can run:

```bash
curl -fsSL -O https://github.com/klay2000/Tonearm/releases/latest/download/install-kiosk.sh
bash install-kiosk.sh
```

## What it does

- Downloads the arch-matching `.AppImage` from the latest GitHub release into
  `~/.local/share/tonearm/`.
- Writes `~/.config/systemd/user/tonearm-kiosk.service` and enables it.
- Re-running updates the AppImage in place. `--uninstall` removes everything.

Nothing needs root — it installs under `$HOME` and runs as `systemctl --user`.

## Assumptions

- **systemd** and a **graphical desktop session the device auto-logs into**
  (e.g. Raspberry Pi OS "Desktop Autologin"). The service is ordered after
  `graphical-session.target` so the app has a display.
- A release contains an AppImage for the device's architecture. The main
  release pipeline currently builds **x86_64** only; an **aarch64** build is
  needed for 64-bit Raspberry Pi devices (tracked separately).

## Fullscreen

Fullscreen is an in-app setting (**Settings → Kiosk → Fullscreen**) and
persists across restarts, so enable it once after first launch.
