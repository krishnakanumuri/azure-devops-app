module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-navigation|' +
      'react-native|' +
      '@react-native|' +
      '@react-native-async-storage|' +
      '@react-native-clipboard|' +
      'react-native-safe-area-context|' +
      'react-native-screens' +
    ')/)',
  ],
  moduleNameMapper: {
    '@react-native-clipboard/clipboard':
      '<rootDir>/__mocks__/@react-native-clipboard/clipboard.js',
  },
};
