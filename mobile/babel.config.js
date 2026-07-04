module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@stores': './src/stores',
            '@hooks': './src/hooks',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@types': './src/types',
            '@config': './src/config',
            '@api': './src/api',
            '@nav': './src/navigation',
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};