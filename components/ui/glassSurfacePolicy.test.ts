import { describe, expect, it } from 'vitest';

import { glassRenderingMode, opaqueGlassFallbackColor } from './glassSurfacePolicy';

describe('Liquid Glass fallback policy', () => {
  it('retains native glass on iOS 26+ when accessibility allows transparency', () => {
    expect(
      glassRenderingMode({
        useGlassEffect: true,
        surface: 'solid',
        nativeGlassAvailable: true,
        reduceTransparency: false,
      }),
    ).toBe('native');
  });

  it('makes translucent fallback tints opaque when Reduce Transparency is enabled', () => {
    expect(opaqueGlassFallbackColor('rgba(12, 13, 14, 0.55)', '#191919')).toBe('#191919');
    expect(opaqueGlassFallbackColor('#ffffff99', '#191919')).toBe('#191919');
    expect(opaqueGlassFallbackColor('#22cc88', '#191919')).toBe('#22cc88');
  });

  it('uses a blurred material on iOS 15.1–25', () => {
    expect(
      glassRenderingMode({
        useGlassEffect: true,
        surface: 'solid',
        nativeGlassAvailable: false,
        reduceTransparency: false,
      }),
    ).toBe('blur');
  });

  it('honors Reduce Transparency even when native glass is supported', () => {
    expect(
      glassRenderingMode({
        useGlassEffect: true,
        surface: 'material',
        nativeGlassAvailable: true,
        reduceTransparency: true,
      }),
    ).toBe('solid');
  });

  it('does not turn explicit transparent media overlays into blurred cards', () => {
    expect(
      glassRenderingMode({
        useGlassEffect: false,
        surface: 'transparent',
        nativeGlassAvailable: true,
        reduceTransparency: true,
      }),
    ).toBe('transparent');
  });

  it('keeps ordinary information cards solid and material chips blurred', () => {
    expect(
      glassRenderingMode({
        useGlassEffect: false,
        surface: 'solid',
        nativeGlassAvailable: true,
        reduceTransparency: false,
      }),
    ).toBe('solid');
    expect(
      glassRenderingMode({
        useGlassEffect: false,
        surface: 'material',
        nativeGlassAvailable: false,
        reduceTransparency: false,
      }),
    ).toBe('blur');
  });
});
