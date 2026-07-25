#!/usr/bin/env bash
#
# Build the Tonearm AppImage in a container for a given CPU architecture and
# drop it into ./dist-appimage/. Builds x86_64 natively; aarch64 is built via
# QEMU emulation (buildx), so it works on an x86_64 host with no ARM hardware.
#
# Usage:
#   docker/build.sh                 # build for the host arch
#   docker/build.sh aarch64         # cross-build arm64
#   docker/build.sh x86_64
#
# For a non-native arch, register QEMU binfmt handlers once per boot:
#   docker run --privileged --rm tonistiigi/binfmt --install all

set -euo pipefail

arch="${1:-$(uname -m)}"
case "$arch" in
  x86_64|amd64)  platform="linux/amd64" ;;
  aarch64|arm64) platform="linux/arm64" ;;
  *) echo "usage: $0 [x86_64|aarch64]" >&2; exit 1 ;;
esac

cd "$(dirname "$0")/.."
out="dist-appimage"
mkdir -p "$out"

echo "==> Building Tonearm AppImage for $platform (output -> $out/)"
docker buildx build \
  --platform "$platform" \
  -f docker/Dockerfile \
  --target export \
  --output "type=local,dest=$out" \
  .

echo "==> Done:"
ls -1 "$out"/*.AppImage
