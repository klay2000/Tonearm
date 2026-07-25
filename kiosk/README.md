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

For an offline install or to install a locally-built AppImage (e.g. testing):

```bash
bash install-kiosk.sh --appimage ./Tonearm_x.y.z_aarch64.AppImage
```

## What it does

- Downloads the arch-matching `.AppImage` from the latest GitHub release into
  `~/.local/share/tonearm/` (or installs the one given via `--appimage`).
- Writes `~/.config/systemd/user/tonearm-kiosk.service` and enables it.
- Re-running updates the AppImage in place. `--uninstall` removes everything.

Nothing needs root — it installs under `$HOME` and runs as `systemctl --user`.

## How the service starts the app

The service is `WantedBy=default.target` (reached when the autologin session
begins) and its `ExecStartPre` waits for the X server (`/tmp/.X11-unix/X0`)
before launching, with `DISPLAY=:0` set for the kiosk seat. It deliberately
does **not** bind to `graphical-session.target`: lightdm-based desktops
(Raspberry Pi OS, XFCE, …) don't reliably activate that target in the
`systemd --user` instance, so a service bound to it would never start.
Verified end-to-end on Debian 13 + lightdm + XFCE: boot → autologin →
service → Tonearm launches.

## Assumptions

- **systemd** and a **graphical desktop session the device auto-logs into**
  (e.g. Raspberry Pi OS "Desktop Autologin"). The single kiosk seat is `:0`.
- A release contains an AppImage for the device's architecture. The main
  release pipeline builds **x86_64**; the **aarch64** build for 64-bit
  Raspberry Pi devices is added in #99.

## Fullscreen

Fullscreen is an in-app setting (**Settings → Kiosk → Fullscreen**) and
persists across restarts, so enable it once after first launch.
