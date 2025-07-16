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
import type { JestConfigWithTsJest } from "ts-jest"

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: './jsdom-test-env.ts',
  silent: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  moduleNameMapper: {
    // mocked modules that simply provide necessary, fake module.exports = ...
    // mock modules that are handled by webpack at application level
    // '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$': '<rootDir>/src/__mocks__/fileMock.js',
    '\\.(css)$': '<rootDir>/src/__mocks__/styleMock.js',

    // modules mocking by pointing to other modules/locations
    // Mind that "import { .. } from 'module-x'" is automatically mocked if there is a src/__mocks__/module-x.js file
    // icons will be mapped from ESM to CJS - otherwise we'd have to mock a lot of modules
    '@patternfly/react-icons/dist/esm/icons/(.*)': '<rootDir>/../../node_modules/@patternfly/react-icons/dist/js/icons/$1',
    // tokens will be mapped from ESM to CJS
    '@patternfly/react-tokens/dist/esm/(.*)': '<rootDir>/../../node_modules/@patternfly/react-tokens/dist/js/$1',
  },

  // The path to a module that runs some code to configure or set up the testing
  // framework before each test
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
}

export default config
