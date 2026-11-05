import { describe, expect, it, vi } from 'vitest';

import { readNativePerformanceSnapshot } from './nativePerformance';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios', Version: '15.5' },
}));

describe('native performance metrics on iOS', () => {
  it('does not load NitroModules and keeps the JS performance fallback available', () => {
    const snapshot = readNativePerformanceSnapshot();

    expect(snapshot.available).toBe(false);
    expect(snapshot.error).toContain('disabled in the iOS 15.1-compatible binary');
    expect(snapshot.jsFps).toBeUndefined();
  });
});
