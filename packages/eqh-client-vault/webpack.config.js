const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
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
    Buffer: true,
    setImmediate: true,
    process: false,
    global: true,
    net: 'mock',
    tls: 'mock',
    fs: 'empty',
    child_process: 'empty',
  },
}
