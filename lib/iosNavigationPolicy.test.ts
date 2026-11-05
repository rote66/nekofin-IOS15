import { describe, expect, it } from 'vitest';

import {
  iosMajorVersion,
  iosTabPresentation,
  isBelowUpstreamIOSMinimum,
  usesCompactIPadSidebar,
  usesLegacyIOSPlayerSlot,
  usesLegacyIOSServerForm,
} from './compat/ios15';

describe('iOS tab/sidebar compatibility', () => {
  it('parses native OS versions without treating 15.1 as 151', () => {
    expect(iosMajorVersion('15.1')).toBe(15);
    expect(iosMajorVersion(17)).toBe(17);
    expect(iosMajorVersion('26.0.1')).toBe(26);
  });

  it('adapts only the supported iPadOS 16.4–17 fallback sidebar to narrow windows', () => {
    expect(usesCompactIPadSidebar('ios', true, '16.3', 600)).toBe(false);
    expect(usesCompactIPadSidebar('ios', true, '16.4', 600)).toBe(true);
    expect(usesCompactIPadSidebar('ios', true, '17.7', 799)).toBe(true);
    expect(usesCompactIPadSidebar('ios', true, '17.7', 800)).toBe(false);
    expect(usesCompactIPadSidebar('ios', true, '17.7', 1024)).toBe(false);
    expect(usesCompactIPadSidebar('ios', true, '18.0', 600)).toBe(false);
    expect(usesCompactIPadSidebar('ios', true, '26.0', 600)).toBe(false);
    expect(usesCompactIPadSidebar('ios', false, '17.7', 600)).toBe(false);
    expect(usesCompactIPadSidebar('android', true, '17.7', 600)).toBe(false);
  });

  it.each(['15.1', '16.4', '17.7'])('uses an RN sidebar on iPadOS %s', (version) => {
    expect(iosTabPresentation('ios', true, version)).toEqual({
      legacyNativeTabs: true,
      sidebarAdaptable: false,
      nativeTabMinimization: false,
    });
  });

  it.each(['15.1', '15.5', '16.0', '16.3.1'])(
    'uses the legacy JS tab bar below the upstream iOS minimum: %s',
    (version) => {
      expect(iosTabPresentation('ios', false, version).legacyNativeTabs).toBe(true);
    },
  );

  it.each(['16.4', '16.4.1', '16.7', '17.7', '18.0', '26.0'])(
    'keeps native iPhone tabs on supported iOS %s',
    (version) => {
      expect(iosTabPresentation('ios', false, version).legacyNativeTabs).toBe(false);
    },
  );

  it('compares minor versions and excludes unknown platforms', () => {
    expect(isBelowUpstreamIOSMinimum('ios', '15.5')).toBe(true);
    expect(isBelowUpstreamIOSMinimum('ios', '16')).toBe(true);
    expect(isBelowUpstreamIOSMinimum('ios', '16.3.9')).toBe(true);
    expect(isBelowUpstreamIOSMinimum('ios', 16.4)).toBe(false);
    expect(isBelowUpstreamIOSMinimum('ios', '16.4.1')).toBe(false);
    expect(isBelowUpstreamIOSMinimum('ios', '17.0')).toBe(false);
    expect(isBelowUpstreamIOSMinimum('android', 15)).toBe(false);
    expect(isBelowUpstreamIOSMinimum('ios', 'unknown')).toBe(false);
  });

  it('keeps native iPad sidebar on iOS 18–25 but no iOS 26 tab features', () => {
    expect(iosTabPresentation('ios', true, 18)).toEqual({
      legacyNativeTabs: false,
      sidebarAdaptable: true,
      nativeTabMinimization: false,
    });
  });

  it('preserves native Liquid Glass tab behavior on iOS 26+', () => {
    expect(iosTabPresentation('ios', true, 26)).toEqual({
      legacyNativeTabs: false,
      sidebarAdaptable: true,
      nativeTabMinimization: true,
    });
  });

  it('does not hide phone tabs or alter Android navigation', () => {
    expect(iosTabPresentation('android', true, 26)).toEqual({
      legacyNativeTabs: false,
      sidebarAdaptable: false,
      nativeTabMinimization: false,
    });
  });

  it('uses the React Native server form on iOS 15 where SwiftUI Grid and LabeledContent are absent', () => {
    expect(usesLegacyIOSServerForm('ios', '15.5')).toBe(true);
    expect(usesLegacyIOSServerForm('ios', '16.0')).toBe(false);
    expect(usesLegacyIOSServerForm('android', 15)).toBe(false);
  });

  it('avoids a nested native player bar only below iOS 16.4', () => {
    expect(usesLegacyIOSPlayerSlot('ios', '15.1')).toBe(true);
    expect(usesLegacyIOSPlayerSlot('ios', '15.5')).toBe(true);
    expect(usesLegacyIOSPlayerSlot('ios', '16.3')).toBe(true);
    expect(usesLegacyIOSPlayerSlot('ios', '16.4')).toBe(false);
    expect(usesLegacyIOSPlayerSlot('ios', '17.7')).toBe(false);
    expect(usesLegacyIOSPlayerSlot('ios', '18.0')).toBe(false);
    expect(usesLegacyIOSPlayerSlot('ios', '26.0')).toBe(false);
    expect(usesLegacyIOSPlayerSlot('android', '15.1')).toBe(false);
  });
});
