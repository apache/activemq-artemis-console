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
// noinspection JSUnusedGlobalSymbols

const pluginName = "InvestigationPlugin"

class InvestigationPlugin {
  constructor(properties = {}) {
  }
  apply(compiler) {
    // single compiler hooks just to install compilation hooks
    // see https://webpack.js.org/api/compiler-hooks/#thiscompilation
    compiler.hooks.thisCompilation.tap(pluginName, (compilation, params) => {
      // various compilation hooks
      // see https://webpack.js.org/api/compilation-hooks/
      compilation.hooks.moduleIds.tap(pluginName, (modules) => {
        console.info("modules count:", modules.size)
      })
      compilation.hooks.afterChunks.tap(pluginName, (chunks) => {
        // The afterChunks hook is invoked following the creation of the chunks and module graph, and prior to their
        // optimization. This hook provides an opportunity to examine, analyze, and modify the chunk graph if necessary.
        for (const c of chunks) {
          if (c && c.name) {
            console.info("[afterChunks] original chunk:", c.name)
          }
        }
      })
      compilation.hooks.afterOptimizeChunks.tap(pluginName, (chunks) => {
        // Fired after chunk optimization has completed.
        for (const c of chunks) {
          if (c && c.name) {
            console.info("[afterOptimizeChunks] optimized chunk:", c.name)
          }
        }
      })
      compilation.hooks.afterOptimizeModules.tap(pluginName, (modules) => {
        // Called after modules optimization has completed.
        // for (const m of modules) {
        //   console.info("[afterOptimizeModules] module:", m.identifier())
        // }
      })
    })
  }
}

module.exports = InvestigationPlugin
