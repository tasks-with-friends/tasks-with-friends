const path = require('path');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: {
    // api: './src/functions/api.ts',
    auth: './src/functions/auth.ts',
    graphql: './src/functions/graphql.ts',
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
    alias: {
      'pg-native': path.join(__dirname, 'webpack-aliases/pg-native.js'),
      pgpass$: path.join(__dirname, 'webpack-aliases/pgpass.js'),
    },
  },
};
