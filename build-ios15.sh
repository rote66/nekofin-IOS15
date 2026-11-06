#!/usr/bin/env bash
# Clean-build an iOS 15.1+ Release archive, then package a TrollStore IPA.
# This is ad-hoc code signing for TrollStore, NOT Apple's provisioned Ad Hoc distribution.
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"
export APP_VARIANT=production

WORKSPACE="$ROOT_DIR/ios/nekofin.xcworkspace"
BUILD_DIR="$ROOT_DIR/ios/build"
DERIVED_DATA="$BUILD_DIR/NekoFin-iOS15.1-CleanDerivedData"
ARCHIVE="$BUILD_DIR/NekoFin-iOS15.1-TrollStore.xcarchive"
IPA="$ROOT_DIR/dist/NekoFin-iOS15.1-TrollStore-AdHoc.ipa"
CLEAN_LOG="$BUILD_DIR/build-ios15-clean.log"
BUILD_LOG="$BUILD_DIR/build-ios15-archive.log"

for tool in xcodebuild xcrun codesign python3 ditto; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing required tool: $tool" >&2
    exit 1
  fi
done
if [[ ! -d "$WORKSPACE" || ! -d "$ROOT_DIR/ios/Pods" || ! -d "$ROOT_DIR/node_modules" ]]; then
  echo "Missing iOS workspace, Pods or node_modules. Install project dependencies before building." >&2
  exit 1
fi
HERMES_WRAPPER="$ROOT_DIR/scripts/ios/hermesc-relative-input.sh"
if [[ ! -f "$HERMES_WRAPPER" ]]; then
  echo "Missing Hermes compiler wrapper: $HERMES_WRAPPER" >&2
  exit 1
fi

mkdir -p "$BUILD_DIR"
XCODE_ARGS=(
  -workspace "$WORKSPACE"
  -scheme nekofin
  -configuration Release
  -sdk iphoneos
  -destination 'generic/platform=iOS'
  -derivedDataPath "$DERIVED_DATA"
  CODE_SIGNING_ALLOWED=NO
  CODE_SIGNING_REQUIRED=NO
  CODE_SIGN_IDENTITY=
  HERMES_CLI_PATH="$HERMES_WRAPPER"
  # Keep local absolute source paths out of Swift #filePath and Clang __FILE__ strings.
  "OTHER_SWIFT_FLAGS=\$(inherited) -file-prefix-map $ROOT_DIR=."
  "OTHER_CFLAGS=\$(inherited) -ffile-prefix-map=$ROOT_DIR=."
  "OTHER_CPLUSPLUSFLAGS=\$(inherited) -ffile-prefix-map=$ROOT_DIR=."
)

echo '[1/3] Cleaning iOS Release build...'
if ! xcodebuild "${XCODE_ARGS[@]}" clean >"$CLEAN_LOG" 2>&1; then
  tail -n 80 "$CLEAN_LOG" >&2
  exit 1
fi
# Xcode clean does not remove previously exported archives.
rm -rf -- "$ARCHIVE"

echo '[2/3] Compiling and archiving iOS 15.1+ Release (arm64)...'
echo "Xcode log: $BUILD_LOG"
if ! xcodebuild "${XCODE_ARGS[@]}" -archivePath "$ARCHIVE" archive >"$BUILD_LOG" 2>&1; then
  tail -n 120 "$BUILD_LOG" >&2
  exit 1
fi

echo '[3/3] Ad-hoc signing and packaging the TrollStore IPA...'
python3 "$ROOT_DIR/scripts/ios/package-trollstore-ipa.py" --archive "$ARCHIVE" --output "$IPA"
echo 'Clean build and IPA packaging succeeded.'
