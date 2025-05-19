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
import { HawtioPlugin, hawtio, configManager as hawtioConfigMgr, helpRegistry, workspace, preferencesRegistry} from '@hawtio/react'
import { Artemis } from './Artemis'
import { ArtemisJMX } from './ArtemisJMX'
import { ArtemisPreferences } from './ArtemisPreferences'
import { log, artemisPluginName, artemisPluginTitle, artemisPluginPath, artemisJMXPluginName, artemisJMXPluginPath, artemisJMXPluginTitle } from './globals'
import help from './help.md'
import { configManager } from './config-manager'

export const artemis: HawtioPlugin = () => {



  log.info('Loading', artemisPluginName);

  hawtio.addPlugin({
    id: artemisPluginName,
    title: artemisPluginTitle,
    path: artemisPluginPath,
    component: Artemis,
    order: -2,
    isActive:  async () => workspace.treeContainsDomainAndProperties((await configManager.getArtemisconfig()).jmx.domain),
  })

  hawtio.addPlugin({
    id: artemisJMXPluginName,
    title: artemisJMXPluginTitle,
    path: artemisJMXPluginPath,
    component: ArtemisJMX,
    order: -1,
    isActive:  async () => workspace.treeContainsDomainAndProperties((await configManager.getArtemisconfig()).jmx.domain),
  })

  helpRegistry.add(artemisPluginName, artemisPluginTitle, help, 1)
  preferencesRegistry.add(artemisPluginName, artemisPluginTitle, ArtemisPreferences, 1)

  // See package.json "replace-version" script for how to replace the version placeholder with a real version
  hawtioConfigMgr.addProductInfo('Artemis Console Plugin', '__PACKAGE_VERSION_PLACEHOLDER__')
}
