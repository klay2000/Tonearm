# Builds the Tonearm desktop AppImage inside a container.
#
# Arch-agnostic: apt installs the *container's* native architecture, so the
# same Dockerfile builds x86_64 natively or aarch64 under QEMU emulation via
# buildx (`--platform linux/arm64`). See docker/build.sh.
#
# The final `export` stage contains only the built AppImage(s), so
# `--output type=local` drops them straight onto the host.

FROM debian:trixie AS build

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl wget file git xz-utils \
      build-essential pkg-config patchelf desktop-file-utils \
      libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev \
      libayatana-appindicator3-dev libxdo-dev libssl-dev \
      libfuse2 \
      gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
      gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav \
      nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Rust toolchain (minimal profile; the container arch is the build target).
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /src
COPY . .

RUN npm ci
# AppImage tooling (linuxdeploy) can't use FUSE inside a container, so tell it
# to extract-and-run instead of mounting.
ENV APPIMAGE_EXTRACT_AND_RUN=1
RUN npm run tauri build

# Export stage: only the AppImage(s), for `--output type=local,dest=...`.
FROM scratch AS export
COPY --from=build /src/src-tauri/target/release/bundle/appimage/*.AppImage /
