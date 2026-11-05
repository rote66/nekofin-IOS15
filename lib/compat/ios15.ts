/**
 * Shared JS/TS policy for the original app's pre-iOS-16.4 compatibility range.
 *
 * Keep runtime availability decisions here, not scattered across app routes.
 * Native Swift availability checks live in modules/native-layout/ios/Compatible15_1.swift;
 * third-party native source changes must remain in versioned patches/.
 */
export function iosMajorVersion(version: string | number): number {
  const major = Number.parseInt(String(version), 10);
  return Number.isFinite(major) ? major : 0;
}

/** Original NekoFin starts at iOS 16.4. Its compatible UI must be the default
 * on 16.4+, not the fallback we provide for versions below that minimum. */
export function isBelowUpstreamIOSMinimum(os: string, version: string | number): boolean {
  if (os !== 'ios') return false;
  const match = /^(\d+)(?:\.(\d+))?/.exec(String(version));
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2] ?? 0);
  return major < 16 || (major === 16 && minor < 4);
}

export function usesLegacyIOSServerForm(os: string, version: string | number): boolean {
  const major = os === 'ios' ? iosMajorVersion(version) : 0;
  return major > 0 && major < 16;
}

/**
 * On unsupported iOS < 16.4, a nested native player Stack may leave its hidden 44pt
 * UINavigationBar above the HUD. Three physical Back taps hit
 * _UINavigationBarContentView rather than the RN Pressable.
 *
 * The outer app Stack already owns /player and its orientation. Avoid the
 * second UIKit nav bar with a JS-only Slot, retaining the original nested
 * native Stack on iOS 16.4+ and Android.
 */
export function usesLegacyIOSPlayerSlot(os: string, version: string | number): boolean {
  return isBelowUpstreamIOSMinimum(os, version);
}

/** iPadOS below 18 uses the temporary RN sidebar because SDK 55 lacks the
 * SDK 57 NavigationSplitView bridge. Compact it only on iPadOS 16.4–17; keep
 * iPadOS 15 in its expanded fallback and iPadOS 18+ on the native sidebar. */
export function usesCompactIPadSidebar(
  os: string,
  isPad: boolean,
  version: string | number,
  width: number,
): boolean {
  const major = os === 'ios' ? iosMajorVersion(version) : 0;
  return (
    os === 'ios' &&
    isPad &&
    !isBelowUpstreamIOSMinimum(os, version) &&
    major < 18 &&
    Number.isFinite(width) &&
    width < 800
  );
}

export function iosTabPresentation(os: string, isPad: boolean, version: string | number) {
  const major = os === 'ios' ? iosMajorVersion(version) : 0;
  // SDK 55 has no SwiftUI NavigationSplitView export. iPadOS below 18 uses
  // the interim RN sidebar until we restore SDK 57; hiding native tabs avoids
  // duplicating the sidebar. iPadOS 15 is not part of the validated phone target.

  return {
    legacyNativeTabs: isBelowUpstreamIOSMinimum(os, version) || (isPad && major > 0 && major < 18),
    sidebarAdaptable: isPad && major >= 18,
    nativeTabMinimization: major >= 26,
  };
}
