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
import React from 'react'
import ReactDOM from 'react-dom/client'

import { configManager, HawtioInitialization, Logger, TaskState } from '@hawtio/react/init'

// Hawtio itself creates and tracks initialization tasks, but we can add our own. 'Loading UI' initialization
// task nicely controls the initialization phase at _application_ level
configManager.initItem('Loading UI', TaskState.started, 'config')

// Create root for rendering React components. More React components can be rendered in single root.
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// Basic UI that shows initialization progress without depending on PatternFly.
// It is imported and rendered in fully synchronous way.
root.render(<HawtioInitialization verbose={configManager.globalLogLevel() < Logger.INFO.value} />)

// See package.json "replace-version" script for how to replace the version placeholder with a real version
configManager.addProductInfo('Artemis Console', '__PACKAGE_VERSION_PLACEHOLDER__');

// Initialization phase is finished. We could already bootstrap Hawtio, but this is the stage, where we register
// built-in Hawtio plugins and our examples (custom plugins).
// From now on, we use dynamic `import()` instead of static `import` and we can import _full_ Hawtio packages:
// '@hawtio/react' and '@hawtio/react/ui'
import('@hawtio/react').then(async m => {
  // The heavier non-UI part of Hawtio was loaded/evaluated, so we have access to built-in plugins
  // We can register all default (built-in) Hawtio plugins
  // m.registerPlugins()

  // but we can also choose which built-in plugins to use
  m.keycloak();
  m.oidc();
  m.connect();
  m.jmx();
  m.rbac();
  m.runtime();

  // Register the plugin under development with await, so hawtio.bootstrap() is aware of this plugin
  await import('artemis-console-plugin').then(async m => {
    m.artemis()
  })

  // hawtio.bootstrap() will wait for all init items to be ready, so we have to finish 'loading'
  // stage of UI. UI will be rendered after bootstrap() returned promise is resolved
  configManager.initItem('Loading UI', TaskState.finished, 'config')

  // finally, after we've registered all custom and built-in plugins, we can proceed to the final stage:
  //  - bootstrap(), which finishes internal configuration, applies branding and loads all registered plugins11111
  //  - rendering of <Hawtio> React component after bootstrap() finishes
  m.hawtio.bootstrap().then(() => {
    import('@hawtio/react/ui').then(m => {
      root.render(
          <React.StrictMode>
            <m.Hawtio />
          </React.StrictMode>
      )
    })
  })
})
