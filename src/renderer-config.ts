import webpack, { Configuration, RuleSetUseItem } from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import ESLintWebpackPlugin from 'eslint-webpack-plugin';
import merge from 'webpack-merge';
import fs from 'fs';
import { ElectronRunnerConfig } from './index';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

const isProduction = process.env.NODE_ENV === 'production';
const cwd = process.cwd();
const sourcePath = path.join(cwd, 'src', 'renderer');
const styleLoader = (isModule = false) => {
  const cssLoader: any = {
    loader: 'css-loader',
    options: {
      sourceMap: false,
      modules: isModule,
      import: isModule,
    },
  };
  if (isModule) {
    cssLoader.options.localIdentName = '[path][name]__[local]--[hash:base64:5]';
    cssLoader.options.camelCase = true;
  }
  return isProduction
    ? [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            publicPath: '../../',
          },
        },
        cssLoader,
      ]
    : ['style-loader', cssLoader];
};

const lessLoaderOption: RuleSetUseItem = {
  loader: 'less-loader',
  options: {
    sourceMap: false,
  },
};

const sassLoaderOption: RuleSetUseItem = {
  loader: 'sass-loader',
  options: {
    // Cancel default require sass.
    // implementation: require('sass'),
    sourceMap: false,
  },
};

const tsLoaderOption: RuleSetUseItem = {
  loader: 'ts-loader',
  options: {
    // disable type checker - we will use it in fork plugin
    transpileOnly: true,
  },
};

const devServerOption: DevServerConfiguration = {
  compress: true,
  port: 9080,
  // stats: isProduction ? 'normal' : 'errors-warnings',
};

let config: Configuration = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    app: sourcePath,
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json', '.node'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: styleLoader(),
      },
      {
        test: /\.module.css$/,
        use: styleLoader(true),
      },
      {
        test: /\.m?jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: isProduction
          ? {
              loader: 'file-loader',
              options: {
                limit: 10000,
                name: 'assets/images/[name].[ext]',
                esModule: false,
              },
            }
          : {
              loader: 'url-loader',
              options: {
                esModule: false,
              },
            },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        use: isProduction
          ? {
              loader: 'file-loader',
              options: {
                limit: 10000,
                name: 'assets/medias/[name].[ext]',
                esModule: false,
              },
            }
          : {
              loader: 'url-loader',
              options: {
                esModule: false,
              },
            },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: isProduction
          ? {
              loader: 'file-loader',
              options: {
                limit: 10000,
                name: 'assets/fonts/[name].[ext]',
                esModule: false,
              },
            }
          : {
              loader: 'url-loader',
              options: {
                esModule: false,
              },
            },
      },
    ],
  },
  output: {
    path: path.join(cwd, 'dist', 'application', 'renderer'),
    filename: `assets/js/[name].js`,
    library: {
      type: 'umd2',
    },
    publicPath: isProduction ? './' : '/',
  },
  node: {
    __dirname: false,
    __filename: false,
    global: true,
  },
  plugins: [
    new ESLintWebpackPlugin(),
    // https://www.npmjs.com/package/ts-loader
    new webpack.WatchIgnorePlugin({
      paths: [/\.js$/, /\.d\.ts$/],
    }),
    // https://github.com/jantimon/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve('public', 'index.html'),
      minify: isProduction,
    }),
    // https://github.com/TypeStrong/fork-ts-checker-webpack-plugin
    new ForkTsCheckerWebpackPlugin({}),
  ],
  optimization: {
    minimize: isProduction,
    minimizer: isProduction ? [new CssMinimizerPlugin()] : undefined,
    splitChunks: isProduction
      ? {
          cacheGroups: {
            commons: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        }
      : false,
  },
  target: 'electron15.3-renderer',
  stats: isProduction ? 'normal' : 'errors-warnings',
  devServer: devServerOption,
};

if (config.plugins) {
  if (isProduction) {
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: 'assets/styles/[name].css',
      }),
      new webpack.optimize.MinChunkSizePlugin({
        minChunkSize: 10000,
      })
    );
  } else {
    config.plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.SourceMapDevToolPlugin()
    );
  }
}

function createLessConfig(lessLoaderOption: RuleSetUseItem) {
  return [
    {
      test: /\.less$/,
      use: [...styleLoader(), lessLoaderOption],
    },
    {
      test: /\.module.less$/,
      use: [...styleLoader(true), lessLoaderOption],
    },
  ];
}

function createSassConfig(sassLoaderOption: RuleSetUseItem) {
  return [
    {
      test: /\.s[ac]ss$/i,
      use: [...styleLoader(), sassLoaderOption],
    },
    {
      test: /\.module.s[ac]ss$/i,
      use: [...styleLoader(true), sassLoaderOption],
    },
  ];
}

function createTsConfig(...tsLoaderOptions: RuleSetUseItem[]) {
  return {
    test: /\.tsx?$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
      },
      ...tsLoaderOptions,
    ],
  };
}

const restConfigFilePath = path.resolve('electron.config.js');

// less设置
let lessConfig: RuleSetUseItem = lessLoaderOption;
// sass设置
let sassConfig: RuleSetUseItem = sassLoaderOption;
// ts设置
let tsConfigs: RuleSetUseItem[] = [tsLoaderOption];

if (fs.existsSync(restConfigFilePath)) {
  const _config: ElectronRunnerConfig = require(restConfigFilePath);
  if (typeof _config === 'object') {
    if (typeof _config.less === 'function') {
      lessConfig = _config.less(lessLoaderOption);
    }

    if (typeof _config.sass === 'function') {
      sassConfig = _config.sass(sassLoaderOption);
    }

    if (typeof _config.ts === 'function') {
      tsConfigs = _config.ts(tsLoaderOption);
    }

    // 开发服务器
    if (_config.devServer) {
      config.devServer = {
        ...config.devServer,
        ..._config.devServer,
      };
    }

    // 重写loaders
    if (typeof _config.overwriteLoaders === 'function') {
      config.module = config.module || { rules: [] };
      config.module.rules = _config.overwriteLoaders(
        config.module.rules as any
      );
    }

    // 重写 plugins
    if (typeof _config.overwritePlugins === 'function') {
      config.plugins = _config.overwritePlugins(config.plugins || ([] as any));
    }

    if (_config.webpack) {
      config = merge(config, _config.webpack);
    }
  }
}

if (config.module && config.module.rules) {
  config.module.rules.push(...createLessConfig(lessConfig));
  config.module.rules.push(...createSassConfig(sassConfig));
  config.module.rules.push(createTsConfig(...tsConfigs));
}

export const rendererConfig = config;
