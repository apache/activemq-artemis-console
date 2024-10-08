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
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const TerserPlugin = require("terser-webpack-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const { WebpackManifestPlugin } = require("webpack-manifest-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')

const outputPath = path.resolve(__dirname, 'build')

module.exports = (webpackEnv, args) => {
  const isEnvDevelopment = args.mode === 'development';
  const isEnvProduction = args.mode === 'production';

  return {
    target: [ "browserslist" ],
    // Webpack noise constrained to errors and warnings
    stats: "errors-warnings",
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    devtool: isEnvProduction ? false : 'cheap-module-source-map',
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
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
        PUBLIC_URL: '/console'
      }),
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
        publicPath: '/console',
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
              gitignore: true,
              ignore: ['**/index.html', '**/favicon.ico'],
            },
          },
        ],
      }),
      new ModuleFederationPlugin({
        // The container name corresponds to 'scope' passed to HawtioPlugin
        name: 'artemisPlugin',
        filename: 'remoteEntry.js',
        // The key in exposes corresponds to 'remote' passed to HawtioPlugin
        exposes: {
          './plugin': './src/artemis-extension',
        },
        shared: {
          ...dependencies,
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
        },
      })
    ],
    entry: "./src/index.ts",
    output: {
      // Required for Module Federation
      publicPath: 'auto',
      path: outputPath,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename: isEnvProduction
          ? 'static/js/[name].[contenthash:8].js'
          : isEnvDevelopment && 'static/js/bundle.js',
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
          ],
          // Don't consider CSS imports dead code even if the
          // containing package claims to have no side effects.
          // Remove this when webpack adds a warning or an error for this.
          // See https://github.com/webpack/webpack/issues/6571
          sideEffects: true
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
       // To resolve errors for @module-federation/utilities 2.x
      // https://github.com/module-federation/universe/issues/827
      fallback: {
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify'),
      },
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
        }),
        // This is only used in production mode
        new CssMinimizerPlugin(),
      ],
    },
    devServer: {
      setupMiddlewares: (middlewares, devServer) => {
          // Enabling branding in dev mode
          devServer.app.use((req, _, next) => {
            if (req.url.startsWith('/artemis-extension')) {
              req.url = req.url.replace(/\/artemis-plugin(.*)/, '/hawtio$1')
            }
            next()
          })
          // Redirect / or /console to /console/
          devServer.app.get('/', (_, res) => res.redirect('/console/'))
          devServer.app.get('/console$', (_, res) => res.redirect('/console/'))

          const username = 'developer'
          const proxyEnabled = true
          const plugin = []
          const hawtconfig = {}

          // Hawtio backend API mock
          let login = true
          devServer.app.get('/console/user', (_, res) => {
            login ? res.send(`"${username}"`) : res.sendStatus(403)
          })
          devServer.app.post('/console/auth/login', (_, res) => {
            login = true
            res.send(String(login))
          })
          devServer.app.get('/console/auth/logout', (_, res) => {
            login = false
            res.redirect('/console/login')
          })
          devServer.app.get('/console/proxy/enabled', (_, res) => res.send(String(proxyEnabled)))
          devServer.app.get('/console/plugin', (_, res) => res.send(JSON.stringify(plugin)))

          // hawtconfig.json mock
          devServer.app.get('/console/hawtconfig.json', (_, res) => res.send(JSON.stringify(hawtconfig)))

          middlewares.push({
            name: 'hawtio-backend',
            path: '/console/proxy',
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
