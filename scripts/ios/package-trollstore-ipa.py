#!/usr/bin/env python3
"""Package an offline Release .app as an ad-hoc-signed TrollStore/jailbreak IPA.

This is *not* Apple's Ad Hoc distribution method, which requires an Apple
Distribution identity and a provisioning profile listing each device's UDID.
TrollStore or a compatible jailbreak installer is required for this artifact.
"""

import argparse
import hashlib
import json
from pathlib import Path
import plistlib
import shutil
import subprocess
import tempfile
import zipfile


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ARCHIVE = ROOT / "ios/build/NekoFin-iOS15.1-TrollStore.xcarchive"
DEFAULT_IPA = ROOT / "dist/NekoFin-iOS15.1-TrollStore-AdHoc.ipa"
GENERATED_ARTIFACT_PREFIX = "NekoFin-iOS15.1-TrollStore-AdHoc"


def call(*args):
    result = subprocess.run(args, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(
            f"Command failed: {' '.join(map(str, args))}\n"
            f"{result.stdout[-1000:]}\n{result.stderr[-2000:]}"
        )
    return result.stdout + result.stderr


def sanitize_local_paths(app):
    """Replace local build-machine prefixes in packaged diagnostic strings.

    Several upstream Swift dependencies embed #filePath values in the app's
    runtime string section. Keep every replacement byte-for-byte the same
    length so Mach-O offsets and string storage remain unchanged; code is
    re-signed after this pass.
    """
    root_prefix = str(ROOT).encode()
    home_prefix = str(Path.home()).encode()
    replacements = (
        (root_prefix, b"source-root" + b"_" * (len(root_prefix) - len(b"source-root"))),
        (home_prefix, b"local-home" + b"_" * (len(home_prefix) - len(b"local-home"))),
    )
    changed_files = 0
    replaced_paths = 0
    for path in app.rglob("*"):
        if path.is_symlink() or not path.is_file():
            continue
        original = path.read_bytes()
        sanitized = original
        for prefix, replacement in replacements:
            replaced_paths += sanitized.count(prefix)
            sanitized = sanitized.replace(prefix, replacement)
        if sanitized != original:
            path.write_bytes(sanitized)
            changed_files += 1
    return changed_files, replaced_paths


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, default=DEFAULT_ARCHIVE)
    parser.add_argument("--output", type=Path, default=DEFAULT_IPA)
    args = parser.parse_args()

    source = args.archive / "Products/Applications/nekofin.app"
    if not source.is_dir():
        raise SystemExit(f"Missing Release archive app: {source}")
    info = plistlib.loads((source / "Info.plist").read_bytes())
    executable = source / info["CFBundleExecutable"]
    if not executable.is_file():
        raise RuntimeError("Archive is missing the executable")
    if info.get("MinimumOSVersion") != "15.1":
        raise RuntimeError(f"Unexpected minimum iOS version: {info.get('MinimumOSVersion')}")
    if not (source / "main.jsbundle").is_file():
        raise RuntimeError("Release app has no embedded main.jsbundle; do not ship a Metro-dependent Debug IPA")
    architectures = call("xcrun", "lipo", "-archs", executable).split()
    if architectures != ["arm64"]:
        raise RuntimeError(f"Unexpected device architectures: {architectures}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="nekofin-trollstore-") as temp:
        stage = Path(temp)
        payload = stage / "Payload"
        payload.mkdir()
        target = payload / "nekofin.app"
        shutil.copytree(source, target, symlinks=True)
        changed_files, replaced_paths = sanitize_local_paths(target)
        print(
            f"Sanitized local source paths in {changed_files} packaged files "
            f"({replaced_paths} occurrences)."
        )
        (target / "embedded.mobileprovision").unlink(missing_ok=True)

        # Sign all independently loadable code before sealing the app bundle.
        nested = []
        for path in target.rglob("*"):
            if path.is_symlink():
                continue
            if path.is_dir() and path.suffix in (".framework", ".appex", ".xpc"):
                nested.append(path)
            elif path.is_file() and path.suffix == ".dylib":
                # Sign the enclosing framework, not both a symlink and its target.
                if not any(parent.suffix == ".framework" for parent in path.parents):
                    nested.append(path)
        for path in sorted(nested, key=lambda item: len(item.parts), reverse=True):
            call("codesign", "--force", "--sign", "-", "--timestamp=none", str(path))
        call("codesign", "--force", "--sign", "-", "--timestamp=none", str(target))
        call("codesign", "--verify", "--deep", "--strict", "--verbose=2", str(target))

        output = args.output.resolve()
        call("ditto", "-c", "-k", "--sequesterRsrc", "--keepParent", str(payload), str(output))
        with zipfile.ZipFile(output) as package:
            bad = package.testzip()
            if bad:
                raise RuntimeError(f"IPA archive has a corrupt entry: {bad}")
            paths = set(package.namelist())
            if "Payload/nekofin.app/main.jsbundle" not in paths:
                raise RuntimeError("IPA is missing the embedded JavaScript bundle")
            if "Payload/nekofin.app/Info.plist" not in paths:
                raise RuntimeError("IPA is missing the app Info.plist")

    digest = hashlib.sha256()
    with output.open("rb") as file:
        for block in iter(lambda: file.read(4 * 1024 * 1024), b""):
            digest.update(block)
    report = {
        "filename": output.name,
        "sha256": digest.hexdigest(),
        "size_bytes": output.stat().st_size,
        "bundle_id": info.get("CFBundleIdentifier"),
        "bundle_version": info.get("CFBundleVersion"),
        "minimum_ios": info.get("MinimumOSVersion"),
        "architecture": "arm64",
        "build_configuration": "Release",
        "embedded_js": True,
        "signature": "ad-hoc (codesign -s -; no Apple distribution certificate)",
        "installer": "TrollStore or compatible jailbroken-device installer only",
    }
    manifest = output.with_suffix(".json")
    manifest.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")

    # Keep one current installable IPA in dist after the replacement is verified.
    for pattern in (f"{GENERATED_ARTIFACT_PREFIX}*.ipa", f"{GENERATED_ARTIFACT_PREFIX}*.json"):
        for stale in output.parent.glob(pattern):
            if stale.resolve() != output.resolve() and stale.resolve() != manifest.resolve():
                stale.unlink()

    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"IPA: {output}")
    print(f"Manifest: {manifest}")


if __name__ == "__main__":
    main()
