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
import React, { useEffect, useState } from 'react'
import { ArtemisTabs } from './views/ArtemisTabView';
import { PageSection, TextContent, Text, PageSectionVariants, Page } from '@patternfly/react-core';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { artemisService } from './artemis-service';
import { eventService } from '@hawtio/react';



export const Artemis: React.FunctionComponent = () => {

  const [brokerName, setBrokerName] = useState("");

  useEffect(() => {
    const getBrokerInfo = async () => {
        artemisService.getBrokerInfo()
            .then((brokerInfo) => {
                setBrokerName(brokerInfo.name)
            })
            .catch((error: string) => {
                eventService.notify({
                    type: 'warning',
                    message: error,
                })
            });
    }
    getBrokerInfo();
  }, [brokerName])

  return ( 
  <Page>
    <PageSection variant={PageSectionVariants.light}>
      <Grid >
        <GridItem span={2}>
          <TextContent>
            <Text component="h1">Broker: {brokerName}</Text>
          </TextContent>
        </GridItem>
      </Grid>
    </PageSection>
    <PageSection isFilled>
      <ArtemisTabs/>
    </PageSection>
  </Page>
  )
}

