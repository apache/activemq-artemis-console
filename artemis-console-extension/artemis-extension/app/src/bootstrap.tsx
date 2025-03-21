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
import { hawtio, Hawtio,  connect, jmx, keycloak, oidc, rbac, runtime, configManager } from '@hawtio/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { artemis } from './artemis-extension/artemis';

// Register builtin plugins

keycloak();
oidc();
connect();
jmx();
rbac();
runtime();

// Register the plugin under development
artemis();

// See package.json "replace-version" script for how to replace the version placeholder with a real version
configManager.addProductInfo('Artemis Console', '__PACKAGE_VERSION_PLACEHOLDER__');
  
// Bootstrap Hawtio
hawtio.bootstrap();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Hawtio />
  </React.StrictMode>,
);
