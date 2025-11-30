const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const { builtinModules } = require('module');

module.exports = {
  experiments: {
    topLevelAwait: true,
  },

  // Produce a CommonJS bundle suitable for Node runtime so `require` works.
  externalsType: 'commonjs',
  // Don't auto-externalize node_modules so we can bundle specific ESM packages
  externalsPresets: { node: false },
  // Externalize most node_modules as CommonJS, but bundle `webtorrent`
  externals: [
    function ({ request }, callback) {
      if (!request) return callback();
      // Don't externalize relative or absolute imports
      if (request.startsWith('.') || request.startsWith('/')) return callback();
      // Keep Node built-ins external (child_process, fs, etc.) so they're required at runtime
      const rawRequest = request.replace(/^node:/, '');
      if (builtinModules.includes(rawRequest)) {
        return callback(null, 'commonjs ' + request);
      }
      // Bundle `webtorrent` into the output so ESM top-level-await is handled by webpack
      if (request === 'webtorrent' || request.startsWith('webtorrent/')) {
        return callback();
      }
      // Externalize everything else as commonjs
      return callback(null, 'commonjs ' + request);
    },
  ],

  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    library: { type: 'commonjs2' },
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },

  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
      format: ['cjs'], // emit CommonJS bundle
    }),
  ],
};
