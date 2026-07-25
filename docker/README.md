# Containerized AppImage builds

Builds the Tonearm desktop AppImage in a pinned Debian container, so you don't
need the full Tauri toolchain on the host — and so **aarch64 can be built on an
x86_64 machine** via QEMU emulation (see #101, complements the native-runner CI
in #99).

## Usage

```bash
# Build for this machine's architecture:
docker/build.sh

# Cross-build the arm64 AppImage on an x86_64 host (one-time QEMU setup):
docker run --privileged --rm tonistiigi/binfmt --install all
docker/build.sh aarch64
```

The resulting `Tonearm_<version>_<arch>.AppImage` lands in `./dist-appimage/`.
Tauri names it with the arch token, so the auto-updater (`updateCheck.js`) and
the kiosk installer (`install-kiosk.sh`) match it automatically.

## How it works

- `docker/Dockerfile` is arch-agnostic — `apt` installs the container's native
  architecture. Building with `--platform linux/arm64` runs the whole build
  (including the Rust compile) as arm64 under QEMU, which sidesteps the
  cross-compile/sysroot pain of mixing architectures in one image.
- The AppImage tooling can't use FUSE inside a container, so the build sets
  `APPIMAGE_EXTRACT_AND_RUN=1`.
- A `scratch` `export` stage holds only the AppImage(s); `build.sh` uses
  `--output type=local` to copy them to the host without a container run.

> **Note:** arm64 builds run under emulation and are **much slower** than native
> (the Rust compile especially). For routine releases the native `ubuntu-24.04-arm`
> runner (#99) is faster; this container is for local builds and as a
> no-ARM-hardware fallback.
