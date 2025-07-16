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
import { beforeAll, describe, expect, test } from "@jest/globals"
import fetchMock, { MockResponseInit } from 'jest-fetch-mock'
import { jolokiaService, userService } from '@hawtio/react'
import { hawtio } from '@hawtio/react'

beforeAll(async () => {
  // needed to determine Jolokia URL
  await userService.fetchUser().catch(e => {
    console.error("error fetching user:", e)
  })
})

describe("Jolokia basic tests", () => {
  beforeEach(() => {
    fetchMock.mockResponse(async (_: Request): Promise<MockResponseInit | string> => {
      return {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: 200,
          timestamp: Date.now(),
          request: { type: "version" },
          value: {
            agent: "2.1.0",
            protocol: "8.1"
          }
        }),
      }
    })
  })

  test("Jolokia version available", async () => {
    console.info("Hawtio Base path:", hawtio.getBasePath())
    // expect.assertions(1)
    const j = await jolokiaService.getJolokia()
    const v = await j.version()
    expect(v.protocol).toBe("8.1")
  })
})
