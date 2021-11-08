import webpack, { Configuration } from 'webpack';
import path from 'path';
const isProduction = process.env.NODE_ENV === 'production';
const cwd = process.cwd();
const sourcePath = path.join(cwd, 'src', 'main');

export const mainConfig: Configuration = {
  entry: sourcePath,
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(cwd, 'dist', 'application'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  node: {
    __dirname: !isProduction,
    __filename: !isProduction,
    global: true,
  },
  plugins: [
    new webpack.WatchIgnorePlugin({
      paths: [/\.js$/, /\.d\.ts$/],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json', '.node'],
  },
  target: 'electron15.3-main',
  stats: isProduction ? 'normal' : 'errors-warnings',
  mode: isProduction ? 'production' : 'development',
};
