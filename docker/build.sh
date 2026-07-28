#!/usr/bin/env bash
#
# Build the Tonearm AppImage in a container and drop it into ./dist-appimage/.
#
# Two ways to produce an aarch64 AppImage on an x86_64 host:
#   * default  - emulate the whole build under QEMU (docker/Dockerfile). Simple,
#                but the Rust compile is very slow.
#   * --cross  - real cross-compile (docker/Dockerfile.cross): the container is
#                the host's native arch and only the Rust *target* is aarch64,
#                so the compile runs at native speed. No QEMU required.
#
# Usage:
#   docker/build.sh                 # build for the host arch
#   docker/build.sh aarch64         # emulate an arm64 build under QEMU
#   docker/build.sh aarch64 --cross # cross-compile an arm64 build (fast)
#   docker/build.sh x86_64
#
# QEMU is only needed for the default (emulated) non-native build; register the
# binfmt handlers once per boot:
#   docker run --privileged --rm tonistiigi/binfmt --install all

set -euo pipefail

die() { echo "$*" >&2; exit 1; }

arch=""
cross=0
for a in "$@"; do
  case "$a" in
    --cross)                 cross=1 ;;
    x86_64|amd64|aarch64|arm64) arch="$a" ;;
    *) die "usage: $0 [x86_64|aarch64] [--cross]" ;;
  esac
done
arch="${arch:-$(uname -m)}"

case "$arch" in
  x86_64|amd64)  platform="linux/amd64" ;;
  aarch64|arm64) platform="linux/arm64" ;;
  *) die "usage: $0 [x86_64|aarch64] [--cross]" ;;
esac

cd "$(dirname "$0")/.."
out="dist-appimage"
mkdir -p "$out"

args=(-f docker/Dockerfile --target export --output "type=local,dest=$out")
if [ "$cross" = 1 ]; then
  case "$arch" in
    aarch64|arm64) ;;
    *) die "--cross is only implemented for aarch64 (nothing to cross-compile for $arch)" ;;
  esac
  # Native-arch build image; the cross-compile targets aarch64 internally, so we
  # do NOT set --platform linux/arm64 (that would re-introduce QEMU emulation).
  args=(-f docker/Dockerfile.cross --target export --output "type=local,dest=$out")
  echo "==> Cross-compiling Tonearm aarch64 AppImage on $(uname -m) (output -> $out/)"
else
  args=(--platform "$platform" "${args[@]}")
  echo "==> Building Tonearm AppImage for $platform (output -> $out/)"
fi

docker buildx build "${args[@]}" .

echo "==> Done:"
ls -1 "$out"/*.AppImage
