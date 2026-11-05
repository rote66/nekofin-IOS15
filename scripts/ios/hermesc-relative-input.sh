#!/usr/bin/env bash
# Keep machine-specific Xcode build paths out of the embedded Hermes bytecode.
# React Native invokes hermesc with the input JS bundle as its final argument.
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPILER="$ROOT_DIR/node_modules/hermes-compiler/hermesc/osx-bin/hermesc"
if [[ ! -x "$COMPILER" ]]; then
  COMPILER="$ROOT_DIR/ios/Pods/hermes-engine/destroot/bin/hermesc"
fi
if [[ ! -x "$COMPILER" ]]; then
  echo "Cannot find the installed Hermes compiler." >&2
  exit 1
fi

ARGS=("$@")
LAST_INDEX=$(($# - 1))
if [[ "$LAST_INDEX" -ge 0 && -f "${ARGS[$LAST_INDEX]}" ]]; then
  INPUT="${ARGS[$LAST_INDEX]}"
  cd "$(dirname "$INPUT")"
  ARGS[$LAST_INDEX]="$(basename "$INPUT")"
fi
exec "$COMPILER" "${ARGS[@]}"
