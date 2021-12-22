const path = require('path');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: {
    api: './src/functions/api.ts',
    'get-schema': './src/functions/get-schema.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'build/functions'),
    library: {
      type: 'umd',
    },
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
};
