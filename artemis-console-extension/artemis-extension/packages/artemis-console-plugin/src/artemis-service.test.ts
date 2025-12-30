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
import { beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals"
import { artemisService, parseMBeanName } from "./artemis-service";
import { SortDirection } from './table/ArtemisTable'
import { jolokiaService, userService } from '@hawtio/react'
import { configManager } from './config-manager'

beforeAll(async () => {
  // needed to determine Jolokia URL
  await userService.fetchUser().catch(e => {
    console.error("error fetching user:", e)
  })
})

/**
 * A set of tests that run against a running broker instance to test the integration API
 */
describe("Artemis Service basic tests", () => {

  test("Jolokia instance creation", async () => {
    expect.assertions(1)
    let addresses = artemisService.getAddresses(
        1, 50,
        { id: "0", order: SortDirection.ASCENDING },
        { column: "", operation: "", input: "" }
    )
    await expect(addresses).resolves.toContain("DLQ");
  })

  test("Splitting ObjectNames", () => {
    const mbean = "org.apache.activemq.artemis:broker=\"0.0.0.0:61616\",component=acceptors,filter=\"x,y,z=a\",name=amqp"
    const parsed = parseMBeanName(mbean)
    expect(parsed.domain).toEqual("org.apache.activemq.artemis")
    expect(parsed.properties["broker"]).toEqual("0.0.0.0:61616")
    expect(parsed.properties["filter"]).toEqual("x,y,z=a")
    expect(parsed.properties["name"]).toEqual("amqp")
  })

})

/**
 * Tests for the initialize method in artemis-service.ts
 */
describe("ArtemisService.initialize()", () => {
  
  beforeEach(() => {
    // Clear any mocks before each test
    jest.clearAllMocks()
  })

  test("initialize should set up brokerObjectName promise", async () => {
    // Create a new instance to test initialization
    const testService = new (artemisService.constructor as any)()
    
    // Mock the config manager and jolokia service
    const mockConfig = { jmx: { domain: 'org.apache.activemq.artemis' } }
    jest.spyOn(configManager, 'getArtemisconfig').mockResolvedValue(mockConfig)
    jest.spyOn(jolokiaService, 'search').mockResolvedValue(['org.apache.activemq.artemis:broker=test'])
    
    // Call initialize
    testService.initialize()
    
    // Get the broker object name (which should now be initialized)
    const brokerObjectName = await testService.getBrokerObjectName()
    
    expect(brokerObjectName).toBe('org.apache.activemq.artemis:broker=test')
    expect(configManager.getArtemisconfig).toHaveBeenCalled()
    expect(jolokiaService.search).toHaveBeenCalledWith('org.apache.activemq.artemis:broker=*')
  })

  test("initialize should handle empty search results", async () => {
    const testService = new (artemisService.constructor as any)()
    
    const mockConfig = { jmx: { domain: 'org.apache.activemq.artemis' } }
    jest.spyOn(configManager, 'getArtemisconfig').mockResolvedValue(mockConfig)
    jest.spyOn(jolokiaService, 'search').mockResolvedValue([])
    
    testService.initialize()
    
    const brokerObjectName = await testService.getBrokerObjectName()
    
    expect(brokerObjectName).toBe('')
  })

  test("initialize should handle null search results", async () => {
    const testService = new (artemisService.constructor as any)()
    
    const mockConfig = { jmx: { domain: 'org.apache.activemq.artemis' } }
    jest.spyOn(configManager, 'getArtemisconfig').mockResolvedValue(mockConfig)
    jest.spyOn(jolokiaService, 'search').mockResolvedValue(null as any)
    
    testService.initialize()
    
    const brokerObjectName = await testService.getBrokerObjectName()
    
    expect(brokerObjectName).toBe('')
  })

  test("initialize should handle search errors gracefully", async () => {
    const testService = new (artemisService.constructor as any)()
    
    const mockConfig = { jmx: { domain: 'org.apache.activemq.artemis' } }
    jest.spyOn(configManager, 'getArtemisconfig').mockResolvedValue(mockConfig)
    jest.spyOn(jolokiaService, 'search').mockRejectedValue(new Error('Connection failed'))
    
    testService.initialize()
    
    const brokerObjectName = await testService.getBrokerObjectName()
    
    expect(brokerObjectName).toBe('')
  })

  test("initialize should use first broker when multiple brokers found", async () => {
    const testService = new (artemisService.constructor as any)()
    
    const mockConfig = { jmx: { domain: 'org.apache.activemq.artemis' } }
    jest.spyOn(configManager, 'getArtemisconfig').mockResolvedValue(mockConfig)
    jest.spyOn(jolokiaService, 'search').mockResolvedValue([
      'org.apache.activemq.artemis:broker=broker1',
      'org.apache.activemq.artemis:broker=broker2'
    ])
    
    testService.initialize()
    
    const brokerObjectName = await testService.getBrokerObjectName()
    
    expect(brokerObjectName).toBe('org.apache.activemq.artemis:broker=broker1')
  })

  test("initialize should handle custom JMX domain from config", async () => {
    const testService = new (artemisService.constructor as any)()
    
    const mockConfig = { jmx: { domain: 'custom.domain' } }
    jest.spyOn(configManager, 'getArtemisconfig').mockResolvedValue(mockConfig)
    jest.spyOn(jolokiaService, 'search').mockResolvedValue(['custom.domain:broker=test'])
    
    testService.initialize()
    
    await testService.getBrokerObjectName()
    
    expect(jolokiaService.search).toHaveBeenCalledWith('custom.domain:broker=*')
  })

  test("initialize can be called multiple times safely", async () => {
    const testService = new (artemisService.constructor as any)()
    
    const mockConfig = { jmx: { domain: 'org.apache.activemq.artemis' } }
    jest.spyOn(configManager, 'getArtemisconfig').mockResolvedValue(mockConfig)
    jest.spyOn(jolokiaService, 'search').mockResolvedValue(['org.apache.activemq.artemis:broker=test'])
    
    // Call initialize multiple times
    testService.initialize()
    testService.initialize()
    testService.initialize()
    
    const brokerObjectName = await testService.getBrokerObjectName()
    
    expect(brokerObjectName).toBe('org.apache.activemq.artemis:broker=test')
    // Config should be fetched multiple times (once per initialize call)
    expect(configManager.getArtemisconfig).toHaveBeenCalled()
  })

  test("getBrokerObjectName should return empty string before initialization", async () => {
    const testService = new (artemisService.constructor as any)()
    
    // Don't call initialize
    const brokerObjectName = await testService.getBrokerObjectName()
    
    expect(brokerObjectName).toBe('')
  })
})
