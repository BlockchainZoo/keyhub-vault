const path = require('path')
// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  watch: false,
  entry: {
    'whatwg-fetch': 'whatwg-fetch',
    'abortcontroller-polyfill': 'abortcontroller-polyfill/dist/polyfill-patch-fetch',
    index: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    jquery: 'jQuery',
    jsdom: 'jsdom',
    'node-fetch': {
      commonjs: 'node-fetch',
      amd: 'node-fetch',
      root: 'fetch',
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        APP_ENV: JSON.stringify('browser'),
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          // See: https://medium.com/@zural143/basic-webpack-4-and-es5-to-es6-transpiler-using-babel-dc66e72c86c6
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            // eslint-disable-next-line global-require
            plugins: [require('@babel/plugin-proposal-object-rest-spread')],
          },
        },
      },
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: { inline: true },
        },
      },
    ],
  },
  node: {
    global: true,
    // Buffer: true,
    // setImmediate: true,
    // process: false,
    // net: 'mock',
    // tls: 'mock',
    // fs: 'empty',
    // child_process: 'empty',
  },
}
