const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    static: { directory: path.join(__dirname, 'build/dist') },
    port: 8888,
    hot: true,
    historyApiFallback: true
  },
  devtool: 'inline-source-map',
  output: {
    filename: '[name].js',
  },
});
