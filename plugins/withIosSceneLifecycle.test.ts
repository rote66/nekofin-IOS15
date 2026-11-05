import { describe, expect, it } from 'vitest';

import { applyIosSceneLifecycle } from './withIosSceneLifecycle';

const original = `@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var reactNativeFactory: RCTReactNativeFactory?
  func launch() {
#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
  }
}`;

describe('iOS 15.1 / Xcode 27 scene lifecycle', () => {
  it('moves the initial RN root window to the scene', () => {
    const result = applyIosSceneLifecycle(original);
    expect(result).toContain('UIWindow(windowScene: windowScene)');
    expect(result).toContain('class NekoFinSceneDelegate: UIResponder, UIWindowSceneDelegate');
    expect(result).not.toContain('UIWindow(frame: UIScreen.main.bounds)');
    expect(result).toContain('sceneLaunchOptions = launchOptions');
  });

  it('preserves Expo app delegate URL/universal-link subscribers', () => {
    const result = applyIosSceneLifecycle(original);
    expect(result).toContain('appDelegate.application(UIApplication.shared, open: context.url');
    expect(result).toContain('continue: userActivity');
  });

  it('is idempotent and rejects unknown generated templates', () => {
    const updated = applyIosSceneLifecycle(original);
    expect(applyIosSceneLifecycle(updated)).toBe(updated);
    expect(() => applyIosSceneLifecycle('@main class AppDelegate {}')).toThrow(
      /Expected one Expo SDK 55/,
    );
  });
});
