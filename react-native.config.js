// NitroModules is currently required only by the optional native performance
// toolkit. Its Swift/C++ std::exception_ptr bridge references a libc++ symbol
// missing on iOS 15.x, so keep both native pods enabled on Android only.
module.exports = {
  dependencies: {
    'react-native-nitro-modules': {
      platforms: {
        ios: null,
      },
    },
    'react-native-performance-toolkit': {
      platforms: {
        ios: null,
      },
    },
  },
};
