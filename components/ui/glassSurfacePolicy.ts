export type GlassSurface = 'material' | 'solid' | 'transparent';
export type GlassRenderingMode = 'native' | 'blur' | 'solid' | 'transparent';

/**
 * Reduce Transparency requests an opaque fill, including for callers that
 * supplied a translucent tint for the normal BlurView fallback.
 */
export function opaqueGlassFallbackColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  if (/^(rgba|hsla)\(/i.test(color)) return fallback;
  // The 4/8-digit hex forms can carry alpha.
  if (/^#(?:[\da-f]{4}|[\da-f]{8})$/i.test(color)) return fallback;
  return color;
}

/** A glass view cannot be used on iOS 15–25, or with Reduce Transparency. */
export function glassRenderingMode({
  useGlassEffect,
  surface,
  nativeGlassAvailable,
  reduceTransparency,
}: {
  useGlassEffect: boolean;
  surface: GlassSurface;
  nativeGlassAvailable: boolean;
  reduceTransparency: boolean;
}): GlassRenderingMode {
  if (!useGlassEffect && surface === 'transparent') return 'transparent';
  if (reduceTransparency) return 'solid';
  if (useGlassEffect && nativeGlassAvailable) return 'native';
  if (useGlassEffect || surface === 'material') return 'blur';
  return 'solid';
}
