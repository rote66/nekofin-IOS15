import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { withDangerousMod, type ConfigPlugin } from '@expo/config-plugins';

/**
 * Expo-MPV prebuild postprocesses some MPVKit objects for iOS 16.0, even when
 * the app's deployment target is 15.1. Run the pinned-source rebuild after
 * expo-mpv and reject the native project if any bundled member exceeds 15.1.
 */
const withMpvIos15Compat: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'ios',
    (mod) => {
      execFileSync(
        'python3',
        [join(mod.modRequest.projectRoot, 'scripts/ios/rebuild-mpv-15.1.py')],
        {
          cwd: mod.modRequest.projectRoot,
          stdio: 'inherit',
          timeout: 600_000,
        },
      );
      return mod;
    },
  ]);

export default withMpvIos15Compat;
