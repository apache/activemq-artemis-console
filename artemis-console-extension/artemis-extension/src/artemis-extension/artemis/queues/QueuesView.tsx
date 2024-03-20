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
import React, { useState } from 'react'
import { Navigate } from '../views/ArtemisTabView';
import { QueuesTable } from './QueuesTable';
import { MessagesTable } from '../messages/MessagesTable';
import { Filter } from '../table/ArtemisTable';
import { Title } from '@patternfly/react-core';
import { Message, MessageView } from '../messages/MessageView';

export type QueueNavigate = {
  search: Function
  filter?: Filter
  selectQueue: Function
}

export type MessageNavigate = {
  search: Function
  filter?: Filter
  selectMessage: Function
}

export type Queue = {
  name: string,
  address: string,
  routingType: string
}





export const QueuesView: React.FunctionComponent<Navigate> = navigate => {
  const initialMessage: Message = {
    messageID: '',
    address: '',
    durable: false,
    expiration: 0,
    largeMessage: false,
    persistentSize: 0,
    priority: 0,
    protocol: '',
    redelivered: false,
    timestamp: 0,
    type: 0,
    userID: ''
  };

  const [ activeTabKey, setActiveTabKey ] = useState<string | number>(0);
  const [ currentQueue, setCurrentQueue ] = useState<Queue>({name: "", address: "", routingType: "ANYCAST"});
  const [ currentMessage, setCurrentMessage ] = useState<Message>(initialMessage);

  const selectQueue = (queue: string, address: string, routingType: string) => {
    setCurrentQueue({
      name: queue,
      address: address, 
      routingType: routingType
    });
    setActiveTabKey(1);
  }

  const selectMessage = (message: Message) => {
    setCurrentMessage(message);
    setActiveTabKey(2);
  }

  const back = (tab: number) => {
      setActiveTabKey(tab);
  }

  return (
    <div>
        {activeTabKey === 0 &&
          <QueuesTable search={navigate.search} filter={navigate.filter} selectQueue={selectQueue}/>
        }
        {activeTabKey === 1 &&
        <>
        <Title headingLevel='h2'>Browsing {currentQueue.name}</Title>
        <MessagesTable address={currentQueue.address} queue={currentQueue.name} routingType={currentQueue.routingType} selectMessage={selectMessage} back={back}/>
        </>
        }
        {activeTabKey === 2 &&
        <>
        <Title headingLevel='h2'>Viewing Message on {currentQueue.name}</Title>
        <MessageView currentMessage={currentMessage} back={back}/>
        </>
        }
    </div>
  )
}