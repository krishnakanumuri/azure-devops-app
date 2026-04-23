const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');

// PUBLIC_URL controls the asset base path (e.g. '/' for root, '/repo-name/' for project Pages).
// Set via environment variable; defaults to '/' for local dev.
const publicUrl = (process.env.PUBLIC_URL || '/').replace(/([^/])$/, '$1/');

const babelConfig = {
  presets: [
    // modules: false — let webpack handle ES module tree-shaking; do NOT convert to CJS
    ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] }, modules: false }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['module-resolver', {
      alias: {
        'react-native$': 'react-native-web',
      },
    }],
  ],
};

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';

  return {
    mode: isDev ? 'development' : 'production',
    entry: './web/index.js',
    output: {
      path: path.resolve(__dirname, 'web-dist'),
      filename: '[name].[contenthash].js',
      publicPath: publicUrl,
      clean: true,
    },
    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
      alias: {
        'react-native$': 'react-native-web',
      },
      mainFields: ['browser', 'module', 'main'],
    },    module: {
      rules: [
        {
          // Allow bare specifiers (no extension) inside ESM node_modules
          test: /\.m?js$/,
          resolve: { fullySpecified: false },
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules\/(?!(react-native|@react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-web|@react-native-async-storage|@react-native-clipboard|zustand)\/).*/,
          use: {
            loader: 'babel-loader',
            options: { ...babelConfig, configFile: false, babelrc: false },
          },
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      // Expose PUBLIC_URL to app code (used in RootNavigator for deep-link prefix)
      new webpack.DefinePlugin({
        'process.env.PUBLIC_URL': JSON.stringify(publicUrl),
      }),
      new HtmlWebpackPlugin({
        template: './web/index.html',
      }),
      new CopyPlugin({
        patterns: [{ from: 'web/static', to: '.' }],
      }),
      // Service worker only in production — dev uses live reload instead
      ...(isDev ? [] : [
        new GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: publicUrl + 'index.html',
          // Don't intercept API proxy routes with the navigate fallback
          navigateFallbackDenylist: [/^\/ado\//, /^\/vssps\//],
          runtimeCaching: [
            {
              // Never cache Azure DevOps API responses (sensitive data)
              urlPattern: /^https:\/\/(dev\.azure\.com|.*\.visualstudio\.com)\//,
              handler: 'NetworkOnly',
            },
          ],
        }),
      ]),
    ],
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      // Serve manifest + icons from web/static in dev
      static: [
        { directory: path.join(__dirname, 'web', 'static'), publicPath: '/' },
      ],
      proxy: [
        {
          context: ['/ado'],
          target: 'https://dev.azure.com',
          pathRewrite: { '^/ado': '' },
          changeOrigin: true,
          secure: true,
        },
        {
          context: ['/vssps'],
          target: 'https://vssps.visualstudio.com',
          changeOrigin: true,
          secure: true,
        },
      ],
    },
  };
};
