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
import { eventService, jolokiaService } from '@hawtio/react';
import {  Text } from '@patternfly/react-core';
import { useEffect, useState } from 'react';
import { artemisService } from './artemis-service';


export const ArtemisHeader: React.FunctionComponent = () => {

    const [ brokerHeader, setBrokerHeader] = useState('')

     useEffect(() => {
        artemisService.getBrokerName()
        .then((brokerName) => {
           setBrokerHeader(brokerName ? brokerName : '');
        })
        .catch((error) => {
            eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
        });
    },[])

    return (
        <><Text>{'Broker ('}</Text><Text style={{ color: 'var(--pf-v5-global--active-color--200)' }} >{brokerHeader}</Text><Text>{')'}</Text></>
    );
}