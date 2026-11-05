#!/usr/bin/env python3
"""Recompile MPVKit's postprocessed iOS objects for iOS 15.1.

Do not edit Mach-O LC_BUILD_VERSION fields. We preserve the original static
archives and repair sources, compile the few postprocessed objects again with
the real iOS 15.1 target, and check *every* archive member afterward.

Usage: python3 scripts/ios/rebuild-mpv-15.1.py [--verify-only]
"""

import argparse
import os
from pathlib import Path
import plistlib
import re
import subprocess
import sys
import tempfile

PROJECT = Path(__file__).resolve().parents[2]
PACKAGE = PROJECT / "node_modules/expo-mpv"
FRAMEWORKS = PACKAGE / "ios/Frameworks"
SOURCES = PROJECT / ".tmp/mpv-ios15/uavs3d"
UAVS3D_COMMIT = "0e20d2c291853f196c68922a264bcd8471d75b68"
MINIMUM = (15, 1, 0)
EXPECTED_FRAMEWORK_COUNT = 28
ASSEMBLY = (
    "alf", "deblock", "def", "inter_pred", "intra_pred",
    "intra_pred_chroma", "itrans_dct2", "itrans_dct8_dst7",
    "pixel", "sao_kernel",
)
REBUILDS = (
    ("Libmpv", "fix-moltenvk-resize.py"),
    ("Libavformat", "enable-sup-demuxer.py"),
    ("Libass", "optimize-libass.py"),
    ("Libuavs3d", None),
)


def run(*command, cwd=None, quiet=False):
    result = subprocess.run(
        [str(arg) for arg in command],
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode:
        raise RuntimeError(
            f"Command failed: {' '.join(map(str, command))}\n{result.stdout[-2000:]}\n{result.stderr[-4000:]}"
        )
    if not quiet and result.stderr:
        print(result.stderr.strip(), flush=True)
    return result.stdout


def binary_path(xcframework, item):
    return xcframework / item["LibraryIdentifier"] / item["BinaryPath"]


def ios_slices(xcframework):
    info = plistlib.loads((xcframework / "Info.plist").read_bytes())
    return [item for item in info["AvailableLibraries"]
            if item.get("SupportedPlatform") == "ios"]


def violations(xcframework):
    """Return (identifier, archive member/architecture, minos) tuples."""
    findings = []
    for item in ios_slices(xcframework):
        binary = binary_path(xcframework, item)
        output = run("xcrun", "otool", "-l", binary, quiet=True)
        member = "unknown"
        for line in output.splitlines():
            if line.endswith("):") and "(architecture " in line:
                member = line.rsplit("/", 1)[-1]
            match = re.search(r"^\s+minos\s+(\d+(?:\.\d+)*)", line)
            if match:
                version = tuple((list(map(int, match.group(1).split("."))) + [0, 0, 0])[:3])
                if version > MINIMUM:
                    findings.append((item["LibraryIdentifier"], member, match.group(1)))
    return findings


def audit_all():
    libraries = sorted(FRAMEWORKS.glob("*.xcframework"))
    if len(libraries) != EXPECTED_FRAMEWORK_COUNT:
        raise RuntimeError(
            f"Expected {EXPECTED_FRAMEWORK_COUNT} MPVKit frameworks; found {len(libraries)}"
        )
    present = {library.stem for library in libraries}
    missing = {name for name, _ in REBUILDS} - present
    if missing:
        raise RuntimeError(f"Missing MPVKit libraries: {sorted(missing)}")
    failures = {}
    for xcframework in libraries:
        current = violations(xcframework)
        if current:
            failures[xcframework.stem] = current
    return failures


def rebuild_expo_repair(filename):
    """Execute the package's *existing pinned-source repair*, with 15.1 codegen.

    The upstream repairs use iOS16.0 solely as their compile target. Reuse their
    checksummed source and patch logic without altering their installed scripts.
    """
    script = PACKAGE / "ios" / filename
    code = script.read_text()
    expected = "apple-ios16.0"
    if code.count(expected) != 1:
        raise RuntimeError(f"Unexpected {filename} source (min target)")
    code = code.replace(expected, "apple-ios15.1")
    argv = [str(script), str(FRAMEWORKS)]
    if filename == "enable-sup-demuxer.py":
        condition = 'if symbols.count(MARKER) != len(item["SupportedArchitectures"]):'
        if code.count(condition) != 1:
            raise RuntimeError("Unexpected SUP repair marker check")
        code = code.replace(condition, "if True:  # rebuild already-patched SUP objects for iOS15.1")
    else:
        argv.append("--force")
    original_argv = sys.argv
    try:
        sys.argv = argv
        exec(compile(code, str(script), "exec"), {"__name__": "__main__", "__file__": str(script)})
    finally:
        sys.argv = original_argv


def uavs_source():
    if not (SOURCES / ".git").is_dir():
        SOURCES.parent.mkdir(parents=True, exist_ok=True)
        run("git", "clone", "--branch", "1.2", "--depth", "1",
            "https://github.com/uavs3/uavs3d.git", SOURCES)
    commit = run("git", "-C", SOURCES, "rev-parse", "HEAD").strip()
    if commit != UAVS3D_COMMIT:
        raise RuntimeError(f"Unexpected uavs3d source commit: {commit}")
    return SOURCES / "source/decore/arm64"


def defined_symbols(object_file):
    output = run("xcrun", "nm", "-g", object_file, quiet=True)
    symbols = set()
    for line in output.splitlines():
        parts = line.split()
        if len(parts) >= 3 and parts[-2] in ("T", "D", "S", "B", "W"):
            symbols.add(parts[-1])
    return symbols


def rebuild_uavs3d():
    source = uavs_source()
    library = FRAMEWORKS / "Libuavs3d.xcframework"
    with tempfile.TemporaryDirectory(prefix="mpv-ios15-uavs-", dir=SOURCES.parent) as temp:
        work = Path(temp)
        for item in ios_slices(library):
            if item["LibraryIdentifier"] not in ("ios-arm64", "ios-arm64_x86_64-simulator"):
                # Only ARM64 assembly uses the incompatible target. Catalyst
                # and the simulator x86_64 members are unchanged.
                continue
            binary = binary_path(library, item)
            variant = item.get("SupportedPlatformVariant")
            sdk = "iphonesimulator" if variant == "simulator" else "iphoneos"
            sysroot = run("xcrun", "--sdk", sdk, "--show-sdk-path").strip()
            archives = []
            for arch in item["SupportedArchitectures"]:
                dest = work / item["LibraryIdentifier"] / arch
                dest.mkdir(parents=True)
                archive = dest / "Libuavs3d.a"
                run("xcrun", "lipo", binary, "-thin", arch, "-output", archive)
                if arch == "arm64":
                    original_members = run("xcrun", "ar", "-t", archive).splitlines()
                    for name in ASSEMBLY:
                        member = name + "_arm64.S.o"
                        if original_members.count(member) != 1:
                            raise RuntimeError(f"Expected exactly one {member} in {binary}")
                        run("xcrun", "ar", "-x", archive, member, cwd=dest)
                        old = dest / member
                        original_symbols = defined_symbols(old)
                        fresh = dest / (name + ".new.o")
                        target = f"arm64-apple-ios15.1{'-simulator' if variant == 'simulator' else ''}"
                        run("xcrun", "clang", "-target", target, "-isysroot", sysroot,
                            "-DCOMPILE_10BIT=1", "-I", source,
                            "-c", source / (name + "_arm64.S"), "-o", fresh)
                        if original_symbols != defined_symbols(fresh):
                            raise RuntimeError(f"Symbol mismatch rebuilding {member}: {binary}")
                        # Use the original basename, so ar replaces the
                        # existing member instead of adding another symbol.
                        old.unlink()
                        fresh.rename(old)
                        run("xcrun", "ar", "-r", archive, old)
                    run("xcrun", "ranlib", archive)
                archives.append(archive)
            staged = binary.with_name(binary.name + ".ios15-staged")
            try:
                run("xcrun", "lipo", "-create", *archives, "-output", staged)
                staged.chmod(binary.stat().st_mode)
                os.replace(staged, binary)
            finally:
                staged.unlink(missing_ok=True)
            print(f"Rebuilt ARM64 assembly: {item['LibraryIdentifier']}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    if (FRAMEWORKS / ".version").read_text().strip() != "0.41.0":
        raise RuntimeError("This repair is pinned to MPVKit 0.41.0")
    issues = audit_all()
    if args.verify_only:
        for lib, rows in issues.items():
            print(f"{lib}: {len(rows)} archive members exceed iOS 15.1")
            for row in rows[:8]:
                print("  ", *row)
        if issues:
            raise SystemExit("Rejected: MPVKit contains objects built above iOS 15.1")
        print(f"All {EXPECTED_FRAMEWORK_COUNT} MPVKit iOS archives: every object minOS <= 15.1")
        return

    for library, repair in REBUILDS:
        if library in issues:
            if repair:
                rebuild_expo_repair(repair)
            else:
                rebuild_uavs3d()
    remaining = audit_all()
    if remaining:
        for lib, rows in remaining.items():
            print(f"ERROR {lib}: {rows[:10]}", file=sys.stderr)
        raise SystemExit("Refusing to ship MPVKit with an iOS 15.1 minOS mismatch")
    print("Rebuild complete: every MPVKit iOS archive member targets iOS 15.1 or older")


if __name__ == "__main__":
    main()
