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
import React, { useEffect, useState } from 'react';
import { Select, SelectOption, SelectOptionObject, SelectVariant } from '@patternfly/react-core';
import { artemisService } from '../artemis-service';
import { ActiveSort, Filter, SortDirection } from '../table/ArtemisTable';

export type QueueSelectProps = {
  selectQueue: Function
}

export const QueueSelectInput: React.FunctionComponent<QueueSelectProps> = (queueSelectProps) => {


    const [queues, setQueues] = useState<any[]>()
    const [filter, setFilter] = useState<Filter>({
      column: 'name',
      operation: 'EQUALS',
      input: ''
    })

    useEffect(() => {
      const listData = async () => {
        var activeSort:ActiveSort  = {
          id: 'name',
          order: SortDirection.ASCENDING
        }
        var data: any = await artemisService.getQueues(1, 10, activeSort, filter);
        setQueues(JSON.parse(data).data);
      }
      listData();
  
    }, [filter])
  

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState('');


    const onToggle = () => {
      setIsOpen(!isOpen);
    };

    const handleSelectQueueChange = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
      setIsOpen(false);
      var queueName: string = value as string;
      setSelected(queueName);
      queueSelectProps.selectQueue(queueName);
    }

    const clearSelection = () => {
      setSelected('');
      setIsOpen(false);
    };

    const customFilter = (e: React.ChangeEvent<HTMLInputElement> | null, value: string) => {
      if (!value) {
        return queues?.map((queue: any, index) => (
          <SelectOption key={index} value={queue.name}/>
        ));
      }

      var newFilter: Filter = {
        column: 'name',
        operation: 'CONTAINS',
        input: value}
        setFilter(newFilter);

      return queues?.map((queue: any, index) => (
              <SelectOption key={index} value={queue.name}/>
            ))
    };

    return (
      <div>
        <span id={"select-queues"} hidden>
          Select a Queue
        </span>
        <Select
          variant={SelectVariant.typeahead}
          menuAppendTo="parent"
          typeAheadAriaLabel="Select a Queue"
          onToggle={onToggle}
          onSelect={handleSelectQueueChange}
          onClear={clearSelection}
          onFilter={customFilter}
          selections={selected}
          isOpen={isOpen}
          aria-labelledby={"select-queue"}
          placeholderText="Type Queue Name"
        >
          
            {
              queues?.map((queue: any, index) => (
                <SelectOption key={index} value={queue.name}/>
              ))
            }
          
        </Select>
      </div>
    );
  
}