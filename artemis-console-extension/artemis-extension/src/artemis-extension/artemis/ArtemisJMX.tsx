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
import { CubesIcon } from '@patternfly/react-icons'
import Split from 'react-split'
import { ArtemisContext, useArtemisTree } from './context';
import { ArtemisTreeView } from './ArtemisTreeView';
import { PageSection, TextContent, Text, PageSectionVariants, EmptyState, EmptyStateIcon, EmptyStateVariant, Title } from '@patternfly/react-core';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { ArtemisJMXTabs } from './views/ArtemisJMXTabView';
import './artemisJMX.css'



export const ArtemisJMX: React.FunctionComponent = () => {

  const { tree, selectedNode, brokerNode, setSelectedNode, findAndSelectNode } = useArtemisTree();


  return ( 
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light}>
        <Grid >
          <GridItem span={2}>
          <TextContent>
            <Text component="h1">Broker</Text>
            </TextContent>
          </GridItem>

      </Grid>
    </PageSection>
      <ArtemisContext.Provider value={{ tree, selectedNode,brokerNode, setSelectedNode, findAndSelectNode }}>
    
        <Split className='artemis-split' sizes={[25, 75]} minSize={200} gutterSize={5}>
          <div>
            <ArtemisTreeView />
          </div>
          <div>
            {!selectedNode && 
            <PageSection variant={PageSectionVariants.light} isFilled>
            <EmptyState variant={EmptyStateVariant.full}>
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel='h1' size='lg'>
                Select Artemis Node
              </Title>
            </EmptyState>
          </PageSection>
          }
          {selectedNode && 
            
            <PageSection isFilled>
              <ArtemisJMXTabs node={selectedNode}/>
            </PageSection>
          }
          </div>
        </Split>
      </ArtemisContext.Provider>
    </React.Fragment>
  )
}

