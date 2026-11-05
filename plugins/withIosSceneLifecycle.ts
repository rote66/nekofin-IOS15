import { withAppDelegate, withInfoPlist, type ConfigPlugin } from '@expo/config-plugins';

/**
 * Expo SDK 55 still generates a window from UIApplicationDelegate. Xcode 27
 * rejects that legacy entry point at runtime. Move RN startup to a scene,
 * while keeping the app-delegate Expo subscriber chain for deep links.
 *
 * This is a generated-file transform, not a hand edit to ignored ios/.
 */
export function applyIosSceneLifecycle(source: string): string {
  if (source.includes('class NekoFinSceneDelegate: UIResponder, UIWindowSceneDelegate')) {
    return source;
  }

  const windowDeclaration = '  var window: UIWindow?';
  const windowCount = source.split(windowDeclaration).length - 1;
  if (windowCount !== 1) {
    throw new Error('Expected one Expo SDK 55 AppDelegate.window declaration');
  }
  const launchPattern =
    /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)\s+factory\.startReactNative\(\s+withModuleName: "main",\s+in: window,\s+launchOptions: launchOptions\)\s+#endif/;
  if (!launchPattern.test(source)) {
    throw new Error('Expected Expo SDK 55 legacy React Native window bootstrap');
  }

  const updated = source
    .replace(
      windowDeclaration,
      `${windowDeclaration}
  var sceneLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?`,
    )
    .replace(
      launchPattern,
      `#if os(iOS) || os(tvOS)
    sceneLaunchOptions = launchOptions
#endif`,
    );

  return `${updated}

// Scene support for Xcode 27, while retaining iOS 15.1 as the deployment target.
// The UIWindow must be attached to a UIWindowScene before Fabric mounts.
class NekoFinSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
             options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let sceneWindow = UIWindow(windowScene: windowScene)
    window = sceneWindow
    appDelegate.window = sceneWindow

    var launchOptions = appDelegate.sceneLaunchOptions ?? [:]
    if let context = connectionOptions.urlContexts.first {
      launchOptions[.url] = context.url
    }
    factory.startReactNative(
      withModuleName: "main",
      in: sceneWindow,
      launchOptions: launchOptions)

    // Scene-specific callbacks do not reach UIApplicationDelegate automatically.
    // Route through AppDelegate so Expo subscribers and React Native Linking agree.
    for context in connectionOptions.urlContexts {
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: [:])
    }
    for activity in connectionOptions.userActivities {
      _ = appDelegate.application(UIApplication.shared, continue: activity,
                                  restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    for context in contexts {
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(UIApplication.shared, continue: userActivity,
                                restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?
      .applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?
      .applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?
      .applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?
      .applicationDidEnterBackground(UIApplication.shared)
  }
}
`;
}

const withIosSceneLifecycle: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).NekoFinSceneDelegate',
          },
        ],
      },
    };
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error('NekoFin scene lifecycle requires Swift AppDelegate');
    }
    mod.modResults.contents = applyIosSceneLifecycle(mod.modResults.contents);
    return mod;
  });
};

export default withIosSceneLifecycle;
