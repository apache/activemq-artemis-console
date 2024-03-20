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
const CracoEsbuildPlugin = require('craco-esbuild')
const { hawtioBackend } = require('@hawtio/backend-middleware')
const { dependencies } = require('./package.json')

module.exports = {
  plugins: [{ plugin: CracoEsbuildPlugin }],
  webpack: {
    plugins: {
      add: [
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
            react: {
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
        }),
      ],
    },
    configure: webpackConfig => {
      // Required for Module Federation
      webpackConfig.output.publicPath = 'auto'

      webpackConfig.module.rules.push({
        test: /\.md/,
        type: 'asset/source',
      })

      // For suppressing sourcemap warnings from dependencies
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Critical dependency: the request of a dependency is an expression/,
      ]

       // To resolve errors for @module-federation/utilities 2.x
      // https://github.com/module-federation/universe/issues/827
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          path: require.resolve('path-browserify'),
          os: require.resolve('os-browserify'),
        },
      }

      // MiniCssExtractPlugin - Ignore order as otherwise conflicting order warning is raised
      const miniCssExtractPlugin = webpackConfig.plugins.find(p => p.constructor.name === 'MiniCssExtractPlugin')
      if (miniCssExtractPlugin) {
        miniCssExtractPlugin.options.ignoreOrder = true
      }

      return webpackConfig
    },
  },
  // For plugin development
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
    },
  },
}
