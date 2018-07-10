const path = require('path')

module.exports = {
  mode: 'development',
  entry: {
    'whatwg-fetch': 'whatwg-fetch',
    'abortcontroller-polyfill': 'abortcontroller-polyfill/dist/polyfill-patch-fetch',
    main: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    jsdom: 'jsdom',
    jquery: 'jQuery',
  },
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
