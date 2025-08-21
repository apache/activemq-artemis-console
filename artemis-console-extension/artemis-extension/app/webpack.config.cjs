/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const { ModuleFederationPlugin } = require('webpack').container
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { hawtioBackend } = require('@hawtio/backend-middleware')
const { dependencies } = require('./package.json')
const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const { WebpackManifestPlugin } = require("webpack-manifest-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

const outputPath = path.resolve(__dirname, 'build')

const InvestigationPlugin = require("../plugins/investigation-webpack-plugin/plugin")

module.exports = (webpackEnv, args) => {
  const isEnvDevelopment = args.mode === 'development';
  const isEnvProduction = args.mode === 'production';

  return {
    target: [ "browserslist" ],
    // Webpack noise constrained to errors and warnings
    stats: "errors-warnings",
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    devtool: isEnvProduction ? false : 'cheap-module-source-map',
    performance: {
      maxAssetSize: 15727640, // 15MiB
      maxEntrypointSize: 31457280, // 30MiB
    },
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(Object.assign({}, {
        inject: true,
        template: path.resolve(__dirname, 'public/index.html')
      }, isEnvProduction ? {
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        }
      } : undefined)),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        ignoreOrder: true
      }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: '/hawtio',
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
              fileName => !fileName.endsWith('.map')
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: '**/*',
            to: outputPath,
            context: 'public/',
            globOptions: {
              ignore: ['**/index.html'],
            },
          },
        ],
      }),
      new ModuleFederationPlugin({
        shared: {
          'react': {
            singleton: true,
            requiredVersion: dependencies['react'],
          },
          'react-dom': {
            singleton: true,
            requiredVersion: dependencies['react-dom'],
          },
          'react-router-dom': {
            singleton: true,
            requiredVersion: dependencies['react-router-dom'],
          },
          '@hawtio/react': {
            singleton: true,
            requiredVersion: dependencies['@hawtio/react'],
          },
          'monaco-editor': {
            singleton: true,
            requiredVersion: dependencies['monaco-editor'],
          },
          '@patternfly/react-core': {
            singleton: true,
            requiredVersion: dependencies['@patternfly/react-core'],
          },
        }
      }),
      new MonacoWebpackPlugin({
        // 'html' is required as workaround for 'xml'
        // https://github.com/microsoft/monaco-editor/issues/1509
        languages: ['xml', 'json', 'html'],
        publicPath: '',
        globalAPI: true
      }),
      new InvestigationPlugin({})
    ],
    entry: "./src/index.ts",
    output: {
      // Required for Module Federation
      publicPath: 'auto',
      path: outputPath,
      clean: true,
      // Add /* filename */ comments to generated require()s in the output. Use "verbose" for origin information.
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename: isEnvProduction
          ? 'static/js/[name].[contenthash:8].js'
          : isEnvDevelopment && 'static/js/[name].bundle.js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: isEnvProduction
          ? 'static/js/[name].[contenthash:8].chunk.js'
          : isEnvDevelopment && 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]',
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
            },
          },
        },
        {
          test: /\.css$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              // css is located in `static/css`, use '../../' to locate index.html folder
              // in production `paths.publicUrlOrPath` can be a relative path
              options: {},
            },
            {
              loader: require.resolve('css-loader'),
              options: {
                importLoaders: 1,
                sourceMap: false,
                modules: {
                  mode: 'icss',
                },
              }
            }
          ]
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.md$/i,
          type: 'asset/source',
        },
      ]
    },
    ignoreWarnings: [
      // For suppressing sourcemap warnings from dependencies
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.cjs', '.jsx'],
      alias: {
        '@thumbmarkjs/thumbmarkjs': path.join(__dirname, '../node_modules/@thumbmarkjs/thumbmarkjs/dist/thumbmark.esm.js'),
      },
      // To resolve errors for @module-federation/utilities 2.x
      // https://github.com/module-federation/universe/issues/827
      // fallback: {
      //   path: require.resolve('path-browserify'),
      //   os: require.resolve('os-browserify'),
      // },
      symlinks: true, // with symlinks: false, `webpaack server` doesn't reload on change in the package...
      alias: {
        '@thumbmarkjs/thumbmarkjs': path.join(__dirname, '../node_modules/@thumbmarkjs/thumbmarkjs/dist/thumbmark.esm.js'),
      },
    },
    optimization: isEnvProduction ? {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            ecma: 2023,
            compress: true,
            mangle: true,
            output: {
              ecma: 2023,
              comments: false
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        automaticNameDelimiter: '-',
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            name: 'react',
            priority: 40,
            enforce: true,
          },
          patternfly: {
            test: /[\\/]node_modules[\\/]@patternfly[\\/]/,
            // name: 'patternfly',
            name(module, chunks, cacheGroupKey) {
              const allModules = module
                  .identifier()
                  .split('/')
                  .filter(Boolean);

              // Try to extract package name from node_modules
              const nodeModulesIndex = allModules.indexOf('node_modules');
              if (nodeModulesIndex !== -1) {
                const packageName = allModules[nodeModulesIndex + 1];
                if (packageName && packageName.startsWith('@')) {
                  // Scoped package (e.g., @patternfly/react-core)
                  return `${cacheGroupKey}-${packageName.replace('@', '').replace(/\//g, '-')}`;
                }
                return `${cacheGroupKey}-${packageName}`;
              }

              // Default to the cache group key (e.g., react, patternfly, monaco)
              return cacheGroupKey;
            },
            priority: 30,
            enforce: true,
          },
          monaco: {
            test: /[\\/]node_modules[\\/](monaco-editor)[\\/]/,
            name: 'monaco',
            priority: 25,
            enforce: true,
          },
          hawtio: {
            test: /[\\/]node_modules[\\/]@hawtio[\\/]/,
            name: 'hawtio',
            priority: 20,
            enforce: true,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'other',
            priority: 10,
            enforce: true,
            reuseExistingChunk: true,
          },
        },
      },
      runtimeChunk: 'single',
    } : {},
    devServer: {
      hot: !process.env.DISABLE_WS,
      liveReload: !process.env.DISABLE_WS,
      // changing to "ws" adds 20+ more modules to webpack-generated bundle
      webSocketServer: process.env.DISABLE_WS ? false : 'ws',
      static: [
        {
          directory: path.resolve(__dirname, "build"),
          publicPath: "/hawtio",
        }
      ],
      historyApiFallback: {
        index: "/hawtio/"
      },
      devMiddleware: {
        publicPath: "/hawtio",
        mimeTypes: {
          mjs: "application/javascript"
        },
        writeToDisk: true
      },
      setupMiddlewares: (middlewares, devServer) => {
          // Enabling branding in dev mode
          devServer.app.use((req, _, next) => {
            if (req.url.startsWith('/artemis-extension')) {
              req.url = req.url.replace(/\/artemis-plugin(.*)/, '/hawtio$1')
            }
            next()
          })
          // Redirect / or /hawtio to /hawtio/
          devServer.app.get('/', (_, res) => res.redirect('/hawtio/'))
          devServer.app.get('/hawtio$', (_, res) => res.redirect('/hawtio/'))

          const username = 'developer'
          const proxyEnabled = true
          const plugin = []
          const hawtconfig = {}

          // Hawtio backend API mock
          let login = true
          devServer.app.get('/hawtio/user', (_, res) => {
            login ? res.send(`"${username}"`) : res.sendStatus(403)
          })
          devServer.app.post('/hawtio/auth/login', (_, res) => {
            login = true
            res.send(String(login))
          })
          devServer.app.get('/hawtio/auth/logout', (_, res) => {
            login = false
            res.redirect('/hawtio/login')
          })
          devServer.app.get('/hawtio/auth/config/session-timeout', (_, res) => {
            res.type('application/json')
            res.send('{}')
          })
          devServer.app.get('/hawtio/proxy/enabled', (_, res) => res.send(String(proxyEnabled)))
          devServer.app.get('/hawtio/plugin', (_, res) => res.send(JSON.stringify(plugin)))

          // hawtconfig.json mock
          devServer.app.get('/hawtio/hawtconfig.json', (_, res) => res.send(JSON.stringify(hawtconfig)))

          middlewares.push({
            name: 'hawtio-backend',
            path: '/hawtio/proxy',
            middleware: hawtioBackend({
              // Uncomment it if you want to see debug log for Hawtio backend
              logLevel: 'debug',
            }),
          })

          return middlewares
        }
    }
  }
}
