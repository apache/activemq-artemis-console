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
 import { log } from "./globals"

export type Artemisconfig = {
    /**
     * Configuration for branding & styles.
     */
    jmx: JMXConfig

}

/**
 * JMX configuration type.
 */
export type JMXConfig = {
    domain: string
}

export const ARTEMISCONFIG_JSON = 'artemisconfig.json'

class ConfigManager {
    private config?: Promise<Artemisconfig>

    getArtemisconfig(): Promise<Artemisconfig> {
        if (this.config) {
          return this.config
        }
    
        this.config = this.loadConfig()
        return this.config
      }
    

    private async loadConfig(): Promise<Artemisconfig> {
    
        try {
            const res = await fetch(ARTEMISCONFIG_JSON)
            if (!res.ok) {
                log.info("Unable to load Artemis Config, using Default");
                return {
                    jmx: {
                        domain: "org.apache.activemq.artemis"
                        }
                    }
            }

            const config = await res.json()
            log.info("Loaded Artemis Config:", config);
            return config
        } catch (err) {
            log.info("Unable to load Artemis Config, using Default");
            return {
                jmx: {
                    domain: "org.apache.activemq.artemis"
                }
            }
        }
    }
}

export const configManager = new ConfigManager()
