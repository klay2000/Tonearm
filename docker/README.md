# Containerized AppImage builds

Builds the Tonearm desktop AppImage in a pinned Debian container, so you don't
need the full Tauri toolchain on the host — and so **aarch64 can be built on an
x86_64 machine** via QEMU emulation (see #101, complements the native-runner CI
in #99).

## Usage

```bash
# Build for this machine's architecture:
docker/build.sh

# Cross-compile the arm64 AppImage on an x86_64 host (fast, no QEMU):
docker/build.sh aarch64 --cross

# Emulated arm64 build (slow; needs one-time QEMU setup):
docker run --privileged --rm tonistiigi/binfmt --install all
docker/build.sh aarch64
```

The resulting `Tonearm_<version>_<arch>.AppImage` lands in `./dist-appimage/`.
Tauri names it with the arch token, so the auto-updater (`updateCheck.js`) and
the kiosk installer (`install-kiosk.sh`) match it automatically.

## How it works

There are two Dockerfiles, both arch-agnostic in their `apt` install and both
using a `scratch` `export` stage so `build.sh --output type=local` copies the
AppImage(s) out without a container run. AppImage tooling can't use FUSE in a
container, so both set `APPIMAGE_EXTRACT_AND_RUN=1`.

- **`docker/Dockerfile` (emulated, default).** Building with `--platform
  linux/arm64` runs the *whole* build — including the Rust compile — as arm64
  under QEMU. Simple, but the emulated Rust compile is very slow.
- **`docker/Dockerfile.cross` (`--cross`).** The build image is the host's
  native arch; only the Rust *target* is `aarch64-unknown-linux-gnu`, linked
  against an arm64 multiarch sysroot (`dpkg --add-architecture arm64` +
  `libwebkit2gtk-4.1-dev:arm64` etc.). The Rust compile runs at native speed
  (~2 min vs. many minutes emulated). Tauri's own AppImage step uses
  `linuxdeploy-aarch64`, which can't run here — it's allowed to fail, then the
  AppDir Tauri populated is packed with the **native** `appimagetool` plus the
  aarch64 type-2 runtime supplied as a `--runtime-file` data blob, so **no
  aarch64 code executes and no QEMU is needed**.

> **Thin AppImage caveat:** the `--cross` output is a *thin* AppImage (~5 MB) —
> it does **not** bundle webkit/gtk/gstreamer and instead relies on those libs
> being present on the target (fine for a matching Debian trixie / Raspberry Pi
> OS, but not self-contained). The emulated `docker/Dockerfile` build goes
> through linuxdeploy normally and bundles them.

> **Note:** for routine releases the native `ubuntu-24.04-arm` runner (#99) is
> the intended path; this container is for local builds and as a no-ARM-hardware
> fallback.
