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
// import path from 'node'

/** This is the only place where express.js port is declared - it can be imported wherever it is needed */
const port = 3123

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: './jsdom-test-env.ts',
  silent: false,

  // Automatically clear mock calls and instances between every test
  // clearMocks: true,

  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },

  testRegex: "(/__tests__/.*|.*\\.(test|spec))\\.[jt]sx?$",
  // testRegex: "(/__tests__/.*|jolokia-availability\\.(test|spec))\\.[jt]sx?$",

  moduleNameMapper: {
    // '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$':
    //   '<rootDir>/src/__mocks__/fileMock.js',
   '\\.(css|less)$': '<rootDir>/src/__mocks__/styleMock.js',
  //  '@hawtiosrc/(.*)': '<rootDir>/src/$1',
    'react-markdown': '<rootDir>/../../node_modules/react-markdown/react-markdown.min.js',
    '@patternfly/react-topology': '<rootDir>/src/__mocks__/react-topology.js',
    // '@patternfly/react-icons': '<rootDir>/src/__mocks__/react-icons.js',
   'keycloak-js': '<rootDir>/src/__mocks__/keycloak.js',
   'd3': '<rootDir>/src/__mocks__/d3.js',
   'monaco-editor': '<rootDir>/src/__mocks__/monacoEditor.js',
  //  '@monaco-editor/react': path.resolve(__dirname, './src/__mocks__/monacoEditor.js'),
  //   '@patternfly/react-code-editor': '<rootDir>./src/__mocks__/codeEditorMock.js',
    oauth4webapi: '<rootDir>/src/__mocks__/oauth4webapi.js',
  },

  // The path to a module that runs some code to configure or set up the testing
  // framework before each test
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  testPathIgnorePatterns: ['<rootDir>/node_modules/'],

  // transformIgnorePatterns: ['node_modules/'],
  transformIgnorePatterns: ['node_modules/(?!@patternfly/react-icons/dist/esm/icons)/'],

  coveragePathIgnorePatterns: ['node_modules/'],
}

export default config
export { port }
