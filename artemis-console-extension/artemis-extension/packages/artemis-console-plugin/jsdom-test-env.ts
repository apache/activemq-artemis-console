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
/* eslint-disable import/no-default-export */
// noinspection JSUnusedGlobalSymbols

import JSDOMEnvironment from 'jest-environment-jsdom'

import type { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';
import type { Config } from '@jest/types'

import { port } from "./jest.config"

export default class ArtemisJSDOMEnvironment extends JSDOMEnvironment {
  private globalConfig: Config.GlobalConfig
  private projectConfig: Config.ProjectConfig
  private context: EnvironmentContext

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    this.globalConfig = config.globalConfig
    this.projectConfig = config.projectConfig
    this.context = context;
  }

  async setup(): Promise<void> {
    // https://jestjs.io/docs/configuration#testenvironment-string
    // You can also pass variables from this module to your test suites by assigning them to this.global object
    // – this will make them available in your test suites as global variables.
    await super.setup();

    // remember - `this.global !== global`.
    // "global" is our global and "this.global" is the global that will be available in tests

    // See https://github.com/jsdom/jsdom/issues/2524#issuecomment-902027138
    // the below is needed when I do:
    //     import { setGlobalOrigin } from "undici"
    // which effectively means that we're "using" node in web (jsdom) environment
    // this.global.structuredClone = structuredClone
    // this.global.TextEncoder = TextEncoder
    // this.global.TextDecoder = TextDecoder
    // this.global.ReadableStream = ReadableStream
    // this.global.MessagePort = MessagePort
    this.global.setImmediate = setImmediate
    this.global.Response = Response

    // making fetch() use base URL - just as in the browser
    const originalFetch = global.fetch
    this.global.fetch = async (req, options?: RequestInit): Promise<Response> => {
      const originalReq = req
      if (typeof req === "string") {
        if (!req.startsWith("http:")) {
          if (!req.startsWith("/")) {
            req = "/" + req
          }
          req = `http://localhost:${port}/hawtio` + req
        }
      } else if (req instanceof URL) {
        req = new URL(`http://localhost:${port}/hawtio`, req)
      }
      // console.debug("[intercepted fetch()]", `${originalReq} -> ${req}`)
      return originalFetch(req, options)
    }

    // making Hawtio see proper head/beas/@href attribute
    const base = this.global.document.createElement("base")
    base.setAttribute("href", `http://localhost:${port}/hawtio`)
    this.global.document.head.append(base)
  }
}
