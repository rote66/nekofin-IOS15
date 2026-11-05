import { Platform } from 'react-native';

type PerformanceToolkitModule = typeof import('react-native-performance-toolkit');

export type NativePerformanceSnapshot = {
  available: boolean;
  cpuUsage?: number;
  currentRefreshRate?: number;
  error?: string;
  jsFps?: number;
  maxRefreshRate?: number;
  memoryMB?: number;
  uiFps?: number;
};

let cachedToolkit: PerformanceToolkitModule | null = null;
let toolkitUnavailable = false;
let lastLoadError: string | undefined;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function loadToolkit() {
  if (cachedToolkit) return cachedToolkit;
  if (toolkitUnavailable) return null;

  // NitroModules 0.36.1's Swift/C++ exception_ptr bridge imports
  // __from_native_exception_pointer from libc++. That symbol is absent on
  // iOS 15.x and causes dyld to abort before the app reaches React Native.
  // react-native.config.js excludes the native Nitro module from the *whole*
  // iOS binary because its symbol is unavailable on iOS 15.1. A JS OS check
  // cannot restore native metrics on 16.4+ without a different binary/linker
  // strategy; do not require an unlinked native module on supported iOS.
  if (Platform.OS === 'ios') {
    toolkitUnavailable = true;
    lastLoadError =
      'Native CPU, memory and UI FPS metrics are disabled in the iOS 15.1-compatible binary.';
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedToolkit = require('react-native-performance-toolkit') as PerformanceToolkitModule;
    lastLoadError = undefined;
    return cachedToolkit;
  } catch (error) {
    toolkitUnavailable = true;
    lastLoadError = getErrorMessage(error);
    return null;
  }
}

function readFiniteNumber(read: unknown, errors: string[], label: string) {
  try {
    if (typeof read !== 'function') {
      throw new Error('getter is not available');
    }
    const value = read();
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  } catch (error) {
    errors.push(`${label}: ${getErrorMessage(error)}`);
    return undefined;
  }
}

export function readNativePerformanceSnapshot(): NativePerformanceSnapshot {
  const toolkit = loadToolkit();
  if (!toolkit) {
    return {
      available: false,
      error: lastLoadError ?? 'react-native-performance-toolkit is not available',
    };
  }

  const errors: string[] = [];
  const jsFps = readFiniteNumber(toolkit.getJsFps, errors, 'js fps');
  const uiFps = readFiniteNumber(toolkit.getUiFps, errors, 'ui fps');
  const cpuUsage = readFiniteNumber(toolkit.getCpuUsage, errors, 'cpu');
  const memoryMB = readFiniteNumber(toolkit.getMemoryUsage, errors, 'memory');
  const maxRefreshRate = readFiniteNumber(
    toolkit.getDeviceMaxRefreshRate,
    errors,
    'max refresh rate',
  );
  const currentRefreshRate = readFiniteNumber(
    toolkit.getDeviceCurrentRefreshRate,
    errors,
    'current refresh rate',
  );

  return {
    available: true,
    cpuUsage,
    currentRefreshRate,
    error: errors[0],
    jsFps,
    maxRefreshRate,
    memoryMB,
    uiFps,
  };
}
